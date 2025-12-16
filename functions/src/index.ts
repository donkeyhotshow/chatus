import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import * as admin from 'firebase-admin';

admin.initializeApp();
const db = admin.firestore();
const messaging = admin.messaging();

/**
 * On message create:
 * - update rateLimits/{senderId}.lastMessage = serverTimestamp()
 * - send FCM push to other participants (if tokens exist)
 */
export const onMessageCreate = onDocumentCreated(
  'rooms/{roomId}/messages/{messageId}',
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) return;

    const context = event.params;
    const message = snapshot.data();
    if (!message) return;

    const roomId = context.roomId;
    const senderId = message.senderId;

    try {
      // Update rate limit doc
      if (senderId) {
        await db.doc(`rateLimits/${senderId}`).set({
          lastMessage: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
      }

      // Fetch room participants
      const roomSnap = await db.doc(`rooms/${roomId}`).get();
      if (!roomSnap.exists) return;
      const roomData = roomSnap.data() as any;
      const participants: string[] = roomData.participants || [];

      // For each participant except sender, collect tokens from fcmTokens collection
      const targetUids = participants.filter(uid => uid !== senderId);
      if (targetUids.length === 0) return;

      // Firestore 'in' queries support up to 10 items; chunk if needed
      const chunkSize = 10;
      const allTokens: string[] = [];
      for (let i = 0; i < targetUids.length; i += chunkSize) {
        const chunk = targetUids.slice(i, i + chunkSize);
        const tokensSnap = await db.collection('fcmTokens').where('userId', 'in', chunk).get();
        tokensSnap.docs.forEach(d => {
          const data = d.data() as any;
          if (data?.token) allTokens.push(data.token);
        });
      }

      if (allTokens.length === 0) return;

      const notification = {
        notification: {
          title: message.user?.name || 'New message',
          body: (message.text && message.text.substring(0, 200)) || '',
        },
        data: {
          roomId,
          messageId: snapshot.id,
          senderId: senderId
        }
      };

      // Send multicast (split into batches of 500)
      const BATCH_SIZE = 500;
      for (let i = 0; i < allTokens.length; i += BATCH_SIZE) {
        const batch = allTokens.slice(i, i + BATCH_SIZE);
        const response = await messaging.sendEachForMulticast({ tokens: batch, ...notification });

        // Cleanup invalid tokens
        response.responses.forEach((res: any, idx: number) => {
          if (!res.success) {
            const error = res.error;
            const badToken = batch[idx];
            const code = error && (error as any).code;
            if (code === 'messaging/invalid-registration-token' || code === 'messaging/registration-token-not-registered') {
              // Remove fcmTokens/{token} doc (we store token as doc id)
              db.collection('fcmTokens').doc(badToken).delete().catch(() => { });
            }
          }
        });
      }
    } catch (err) {
      console.error('onMessageCreate error', err);
    }
  });
