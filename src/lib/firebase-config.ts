// Firebase configuration from environment variables
// For local development, create .env.local with NEXT_PUBLIC_FIREBASE_* variables
// For Vercel, add these variables in Settings → Environment Variables

import { isDemoMode } from './demo-mode';
import { logger } from './logger';

// Кэшируем конфигурацию для избежания повторных вычислений
let cachedConfig: typeof firebaseConfig | null = null;
let configValidationCache: boolean | null = null;

function sanitizeEnv(value: unknown) {
  if (value == null) return '';
  const s = String(value);
  // Trim whitespace and remove any CR/LF characters that may be present in env values
  return s.trim().replace(/[\r\n]+/g, '');
}

const databaseURL = sanitizeEnv(process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL);
const measurementId = sanitizeEnv(process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID);

export const firebaseConfig = cachedConfig || (cachedConfig = {
  apiKey: sanitizeEnv(process.env.NEXT_PUBLIC_FIREBASE_API_KEY) || "dummy-api-key",
  authDomain: sanitizeEnv(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN) || "dummy-project-id.firebaseapp.com",
  ...(databaseURL && { databaseURL }),
  projectId: sanitizeEnv(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) || "dummy-project-id",
  storageBucket: sanitizeEnv(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET) || "dummy-project-id.appspot.com",
  messagingSenderId: sanitizeEnv(process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID) || "dummy-sender-id",
  appId: sanitizeEnv(process.env.NEXT_PUBLIC_FIREBASE_APP_ID) || "dummy-app-id",
  ...(measurementId && { measurementId }),
});

// Mask sensitive strings for logging (do not reveal full API keys)
function maskSensitive(value: string | undefined | null) {
  if (!value) return 'MISSING';
  const s = String(value);
  if (s.length <= 8) return '*****';
  return `${s.slice(0, 4)}…${s.slice(-4)}`;
}

// Check raw env for CR/LF presence (helps debug env sanitation issues)
const rawProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '';
const rawAuthDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '';
const projectIdHasCRLF = /[\\r\\n]/.test(rawProjectId);
const authDomainHasCRLF = /[\\r\\n]/.test(rawAuthDomain);

logger.debug('Firebase config loaded', {
  projectId: maskSensitive(firebaseConfig.projectId),
  hasApiKey: !!firebaseConfig.apiKey,
  authDomain: maskSensitive(firebaseConfig.authDomain),
  projectIdRawLength: rawProjectId.length,
  projectIdRawContainsCRLF: projectIdHasCRLF,
  authDomainRawContainsCRLF: authDomainHasCRLF
});

/**
 * Check if Firebase configuration is valid (not placeholder values)
 * In demo mode, always returns true to allow local testing
 */
export function isFirebaseConfigValid(): boolean {
  // Используем кэш для избежания повторных вычислений
  if (configValidationCache !== null) {
    return configValidationCache;
  }

  // In demo mode, allow testing without Firebase
  if (isDemoMode()) {
    configValidationCache = true;
    return true;
  }

  const apiKey = firebaseConfig.apiKey;
  const projectId = firebaseConfig.projectId;
  const authDomain = firebaseConfig.authDomain;

  // Check for placeholder values
  const hasPlaceholderApiKey = !apiKey ||
    apiKey === "dummy-api-key" ||
    apiKey.includes('your-');

  const hasPlaceholderProjectId = !projectId ||
    projectId === "dummy-project-id" ||
    projectId.includes('your_') ||
    projectId.includes('your-');

  const hasPlaceholderAuthDomain = !authDomain ||
    authDomain === "dummy-project-id.firebaseapp.com" ||
    authDomain.includes('dummy-') ||
    authDomain.includes('your_') ||
    authDomain.includes('your-');

  // Config is valid if none of the placeholders are present
  const isValid = !hasPlaceholderApiKey && !hasPlaceholderProjectId && !hasPlaceholderAuthDomain;

  logger.debug('Firebase config validation', {
    apiKey: apiKey ? 'SET' : 'NOT SET',
    projectId: projectId ? 'SET' : 'NOT SET',
    authDomain: authDomain ? 'SET' : 'NOT SET',
    hasPlaceholderApiKey,
    hasPlaceholderProjectId,
    hasPlaceholderAuthDomain,
    isValid
  });

  configValidationCache = isValid;
  return isValid;
}
