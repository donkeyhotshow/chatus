# 📘 CHATUS RUNBOOK & LAUNCH GUIDE

## 🚨 CRITICAL: UNLOCKING THE APP (Stage 0)

### 1. Disable Vercel Authentication (Deployment Protection)
The application is currently locked behind Vercel's "Deployment Protection". This prevents public access and testing.

**Action Required (Vercel Dashboard):**
1. Go to your **Vercel Project Dashboard**.
2. Navigate to **Settings** -> **Deployment Protection**.
3. Find **"Vercel Authentication"** and **DISABLE** it.
4. Alternatively, enable **"Password Protection"** and share the password with the team.
5. **Save Changes**.

### 2. Enable Demo Mode (For Testing without Firebase)
If you need to test the UI without configuring Firebase Auth:

1. Open `.env.local` (or Vercel Environment Variables).
2. Set `NEXT_PUBLIC_DEMO_MODE=true`.
3. Redeploy or restart local server.

---

## 🛠️ TROUBLESHOOTING

### Mobile Keyboard Issues
If the keyboard covers the input on iOS:
- Ensure you are on iOS 15+.
- The app uses `interactive-widget=resizes-content`.
- If issues persist, try refreshing the page (viewport meta tag update).

### "Permission Denied" Errors
- Check Firestore Rules in Firebase Console.
- Ensure `NEXT_PUBLIC_FIREBASE_...` variables are correct.
- If running locally, ensure your IP is not blocked if you have IP restrictions.

---

## 🚀 DEPLOYMENT CHECKLIST

- [ ] Vercel Auth Disabled
- [ ] Environment Variables Set
- [ ] Firestore Rules Deployed
- [ ] `npm run build` passes locally
