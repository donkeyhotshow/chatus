import * as admin from 'firebase-admin';

let initialized = false;

function initializeFirebaseAdmin(): boolean {
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

// Lazy getters to avoid initialization during build time
export function getAdminDb(): admin.firestore.Firestore {
  initializeFirebaseAdmin();
  return admin.firestore();
}

export function getAdminStorage(): admin.storage.Storage {
  initializeFirebaseAdmin();
  return admin.storage();
}

export function getAdminAuth(): admin.auth.Auth {
  initializeFirebaseAdmin();
  return admin.auth();
}

// Legacy exports for backward compatibility (use getters in API routes)
export const adminDb = new Proxy({} as admin.firestore.Firestore, {
  get(_, prop) {
    return getAdminDb()[prop as keyof admin.firestore.Firestore];
  }
});

export const adminStorage = new Proxy({} as admin.storage.Storage, {
  get(_, prop) {
    return getAdminStorage()[prop as keyof admin.storage.Storage];
  }
});

export const adminAuth = new Proxy({} as admin.auth.Auth, {
  get(_, prop) {
    return getAdminAuth()[prop as keyof admin.auth.Auth];
  }
});

export { initializeFirebaseAdmin };
