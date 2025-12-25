import * as admin from 'firebase-admin';

let initialized = false;

function initializeFirebaseAdmin() {
  if (initialized || admin.apps.length) {
    return true;
  }

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    console.error('Firebase Admin: Missing required environment variables');
    return false;
  }

  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey: privateKey.replace(/\\n/g, '\n'),
      }),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
    initialized = true;
    return true;
  } catch (error) {
    console.error('Firebase admin initialization error', error);
    return false;
  }
}

// Initialize on module load
initializeFirebaseAdmin();

export const adminDb = admin.firestore();
export const adminStorage = admin.storage();
export const adminAuth = admin.auth();
export { initializeFirebaseAdmin };
