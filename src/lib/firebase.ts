
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getAuth, Auth } from "firebase/auth";
import { getStorage, FirebaseStorage } from "firebase/storage";
import { firebaseConfig } from "./firebase-config";

interface FirebaseInstances {
    app: FirebaseApp;
    db: Firestore;
    auth: Auth;
    storage: FirebaseStorage;
}

let firebaseInstances: FirebaseInstances | null = null;

function initializeFirebase(): FirebaseInstances {
    console.log('[DEBUG] Initializing Firebase App...');
    // Initialize Firebase with provided config
    // Errors will be handled gracefully at the point of use (e.g., signInAnonymously)
    // Ensure we pass a sanitized config to initializeApp at runtime (trim + remove CR/LF)
    const sanitizedConfig = {
        ...firebaseConfig,
        projectId: String(firebaseConfig.projectId || '').trim().replace(/[\r\n]+/g, ''),
        authDomain: String(firebaseConfig.authDomain || '').trim().replace(/[\r\n]+/g, ''),
    };
    console.debug('[DEBUG] Using sanitizedConfig for initializeApp:', {
        projectId: sanitizedConfig.projectId,
        projectIdLength: sanitizedConfig.projectId.length,
        authDomain: sanitizedConfig.authDomain,
    });
    let app: FirebaseApp;
    if (!getApps().length) {
        app = initializeApp(sanitizedConfig as any);
    } else {
        // If an existing app is present, check for CR/LF or mismatched options. If found,
        // create a new named app with sanitized config to ensure Firestore internals use correct projectId.
        const existingApp = getApp();
        let needNewApp = false;
        try {
            const opts = (existingApp as any).options || {};
            const rawProjectId = String(opts.projectId || '');
            const rawAuthDomain = String(opts.authDomain || '');
            const hasCRLFProject = /[\r\n]/.test(rawProjectId);
            const hasCRLFAuth = /[\r\n]/.test(rawAuthDomain);
            const mismatch = rawProjectId !== sanitizedConfig.projectId || rawAuthDomain !== sanitizedConfig.authDomain;
            if (hasCRLFProject || hasCRLFAuth || mismatch) {
                needNewApp = true;
                console.warn('[WARN] Existing Firebase App options contain CR/LF or mismatch. Creating new sanitized app instance.');
            }
        } catch (e) {
            console.debug('[DEBUG] Error while checking existing app.options', e);
            needNewApp = true;
        }

        if (needNewApp) {
            const uniqueName = `sanitized-${Date.now()}`;
            app = initializeApp(sanitizedConfig as any, uniqueName);
        } else {
            app = existingApp;
        }
    }
    // Log runtime app options to help debug env values in the browser
    try {
        const runtimeProjectId = (app as any).options?.projectId;
        const runtimeAuthDomain = (app as any).options?.authDomain;
        const mask = (s: string | undefined) => {
            if (!s) return 'MISSING';
            return s.length > 12 ? `${s.slice(0,6)}…${s.slice(-4)}` : '*****';
        };
        console.debug('[DEBUG] Firebase runtime app.options:', {
            projectId: runtimeProjectId,
            projectIdMasked: mask(runtimeProjectId),
            authDomain: runtimeAuthDomain,
            authDomainMasked: mask(runtimeAuthDomain),
        });
    } catch (e) {
        console.debug('[DEBUG] Failed to read app.options at runtime', e);
    }
    const db = getFirestore(app);
    // Enable IndexedDB persistence for offline support and faster cache reads.
    // Note: enableIndexedDbPersistence may fail with 'failed-precondition' if multiple
    // tabs are open, or 'unimplemented' in unsupported environments — handle gracefully.
    try {
        enableIndexedDbPersistence(db).catch((err: any) => {
            if (err?.code === 'failed-precondition') {
                console.warn('[WARN] Firestore persistence failed: multiple tabs open. Persistence disabled.', err);
            } else if (err?.code === 'unimplemented') {
                console.warn('[WARN] Firestore persistence is not available in this environment. Persistence disabled.', err);
            } else {
                console.warn('[WARN] Firestore persistence failed to enable:', err);
            }
        });
    } catch (e) {
        // Defensive: log any unexpected errors enabling persistence
        console.warn('[WARN] Unexpected error while enabling Firestore persistence', e);
    }
    const auth = getAuth(app);
    const storage = getStorage(app);
    console.log('[DEBUG] Firebase App initialized successfully.');
    return { app, db, auth, storage };
}

// This function ensures Firebase is initialized only once.
export function getFirebase(): FirebaseInstances {
    if (!firebaseInstances) {
        console.log('[DEBUG] Firebase instances not found, calling initializeFirebase()...');
        firebaseInstances = initializeFirebase();
    }
    console.log('[DEBUG] Returning Firebase instances.');
    return firebaseInstances;
}
