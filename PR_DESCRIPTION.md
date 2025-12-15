# Release v0.1.0 - Mobile-First & Security Hardening

## 🎯 Summary
This release focuses on transforming the application into a true mobile-first experience, hardening security by removing hardcoded secrets, and stabilizing the Service Worker architecture.

## 🛡️ Security Improvements
- **Service Worker**: Removed hardcoded API keys from `public/firebase-messaging-sw.js`.
- **Dynamic Generation**: Implemented `scripts/generate-sw.js` to inject environment variables into the Service Worker at build time.
- **Gitignore**: Added `public/firebase-messaging-sw.js` to `.gitignore` to prevent accidental leaks.

## 📱 Mobile UX Enhancements
- **Viewport Fix**: Added `interactive-widget=resizes-content` to `layout.tsx` to prevent keyboard overlap.
- **Layout Stability**: Replaced `h-screen` with `h-full` and `h-dvh` to respect mobile browser address bars.
- **Smart Input**:
    - Replaced single-line input with auto-expanding `textarea`.
    - Added backdrop blur and safe-area padding for iPhone X+.
    - Optimized tap targets for mobile users.
- **Overscroll**: Disabled `overscroll-behavior-y` to prevent accidental pull-to-refresh.

## 🧹 Code Cleanup
- **Dead Code**: Removed legacy files (`src/main.js`, `src/lib/messaging.ts`, `src/lib/sendPush.ts`).
- **Conflict Resolution**: Removed conflicting `public/sw.js` (Workbox artifact).
- **Refactoring**: Cleaned up `src/lib/presence.ts` (removed duplicate code, fixed imports).

## 🧪 Testing
- **Manual Verification**: Tested on mobile viewports (iPhone 12 Pro simulation).
- **Smoke Tests**: `npm run test:firebase` (Pending verification).

## ⚠️ Notes for Reviewers
- Ensure `.env.local` is populated with correct Firebase credentials.
- The Service Worker is now generated on `npm run dev` and `npm run build`.
