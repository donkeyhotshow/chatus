import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Initialize Admin SDK using service account stored in env (FIREBASE_SERVICE_ACCOUNT) when available.
// This avoids committing sensitive service account JSON to the repository.
try {
  const serviceAccountRaw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (serviceAccountRaw) {
    const serviceAccount = typeof serviceAccountRaw === 'string'
      ? JSON.parse(serviceAccountRaw)
      : serviceAccountRaw;
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as any),
    });
  } else {
    // Fallback to default initialization (e.g., when running locally with GOOGLE_APPLICATION_CREDENTIALS)
    admin.initializeApp();
  }
} catch (e) {
  // If parsing or initialization fails, log and rethrow so deployment fails fast.
  console.error('Failed to initialize Firebase Admin SDK from env FIREBASE_SERVICE_ACCOUNT', e);
  throw e;
}

/**
 * Cloud Function to automatically delete empty rooms older than 24 hours
 * Runs every hour. Includes pagination, time budget, and operation limits.
 */
export const cleanupEmptyRooms = functions.pubsub
  .schedule('every 1 hours')
  .timeZone('UTC')
  .onRun(async () => {
    const db = admin.firestore();
    const now = admin.firestore.Timestamp.now();
    const twentyFourHoursAgo = new admin.firestore.Timestamp(
      now.seconds - 24 * 60 * 60,
      now.nanoseconds
    );

    // Limits to keep the function predictable
    const MAX_BATCH_SIZE = 500; // Firestore limit
    const MAX_ROOMS_PER_RUN = 200; // cap rooms per invocation
    const MAX_RUNTIME_MS = 45_000; // stop early before function timeout

    const startTime = Date.now();
    let currentBatch = db.batch();
    let batchCount = 0;
    let deleteCount = 0;
    let processedRooms = 0;
    let pageStart: admin.firestore.QueryDocumentSnapshot | null = null;

    try {
      while (processedRooms < MAX_ROOMS_PER_RUN && Date.now() - startTime < MAX_RUNTIME_MS) {
        let query = db.collection('rooms')
          .orderBy('createdAt', 'asc')
          .limit(MAX_ROOMS_PER_RUN);

        if (pageStart) {
          query = query.startAfter(pageStart);
        }

        const roomsSnapshot = await query.get();
        if (roomsSnapshot.empty) {
          break;
        }

        for (const roomDoc of roomsSnapshot.docs) {
          pageStart = roomDoc;
          processedRooms++;

          const roomData = roomDoc.data();
          const participants = roomData.participants || [];
          const createdAt = roomData.createdAt;

          if (participants.length !== 0) {
            continue;
          }

          if (!createdAt || createdAt.toMillis() >= twentyFourHoursAgo.toMillis()) {
            continue;
          }

          // Respect time budget before heavy subcollection reads
          if (Date.now() - startTime >= MAX_RUNTIME_MS) {
            functions.logger.warn('Exiting early due to time budget', { processedRooms, deleteCount });
            break;
          }

          const roomRef = roomDoc.ref;
          const [
            messagesSnapshot,
            canvasPathsSnapshot,
            canvasSheetsSnapshot,
            gamesSnapshot
          ] = await Promise.all([
            roomRef.collection('messages').get(),
            roomRef.collection('canvasPaths').get(),
            roomRef.collection('canvasSheets').get(),
            roomRef.collection('games').get(),
          ]);

          const subcollections = [
            messagesSnapshot.docs,
            canvasPathsSnapshot.docs,
            canvasSheetsSnapshot.docs,
            gamesSnapshot.docs,
          ];

          const totalOps = subcollections.reduce((sum, docs) => sum + docs.length, 0) + 1; // +1 for room itself

          if (batchCount + totalOps > MAX_BATCH_SIZE) {
            await currentBatch.commit();
            currentBatch = db.batch();
            batchCount = 0;
          }

          for (const docs of subcollections) {
            for (const doc of docs) {
              currentBatch.delete(doc.ref);
              batchCount++;
            }
          }

          currentBatch.delete(roomRef);
          batchCount++;
          deleteCount++;

          if (deleteCount >= MAX_ROOMS_PER_RUN || Date.now() - startTime >= MAX_RUNTIME_MS) {
            break;
          }
        }

        if (deleteCount >= MAX_ROOMS_PER_RUN || Date.now() - startTime >= MAX_RUNTIME_MS) {
          break;
        }
      }

      if (batchCount > 0) {
        await currentBatch.commit();
      }

      functions.logger.info('cleanupEmptyRooms completed', {
        deleteCount,
        processedRooms,
        durationMs: Date.now() - startTime,
      });

      return { deletedCount: deleteCount, processedRooms };
    } catch (error) {
      functions.logger.error('Error cleaning up empty rooms', { error });
      throw error;
    }
  });

/**
 * Cloud Function to clean up rooms when last participant leaves
 * Triggered when a room document is updated
 */
export const onRoomUpdate = functions.firestore
  .document('rooms/{roomId}')
  .onUpdate(async (change, context) => {
    const roomData = change.after.data();
    const participants = roomData.participants || [];

    // If room is empty, schedule deletion after 1 hour
    if (participants.length === 0) {
      const db = admin.firestore();
      const roomRef = change.after.ref;
      
      // Set a deletion timestamp
      await roomRef.update({
        scheduledDeletion: admin.firestore.Timestamp.fromDate(
          new Date(Date.now() + 60 * 60 * 1000) // 1 hour from now
        ),
      });

      console.log(`Room ${context.params.roomId} scheduled for deletion`);
    } else {
      // Remove scheduled deletion if room has participants again
      const scheduledDeletion = roomData.scheduledDeletion;
      if (scheduledDeletion) {
        await change.after.ref.update({
          scheduledDeletion: admin.firestore.FieldValue.delete(),
        });
      }
    }
  });

