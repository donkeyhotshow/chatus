# 🚀 Deployment Guide

## Required GitHub Secrets

### Firebase
- `FIREBASE_TOKEN` - Firebase CI token
  ```bash
  firebase login:ci
  # Copy the token and add to GitHub Secrets
  ```
- `FIREBASE_PROJECT_ID` - Firebase project ID (e.g., `studio-5170287541`)
- `FIREBASE_SERVICE_ACCOUNT` - (Optional) Service account JSON

### Vercel
- `VERCEL_TOKEN` - Vercel authentication token
  ```bash
  vercel login
  vercel token create
  ```
- `VERCEL_PROJECT_ID` - Project ID from Vercel dashboard
- `VERCEL_ORG_ID` - Organization/Team ID from Vercel dashboard

## Vercel Environment Variables

### Preview (dev)
```
NEXT_PUBLIC_FIREBASE_API_KEY=your-dev-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-dev-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-dev-project
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-dev-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-dev-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-dev-app-id
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://your-dev-project.firebaseio.com
```

### Production
```
NEXT_PUBLIC_FIREBASE_API_KEY=your-prod-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-prod-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-prod-project
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-prod-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-prod-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-prod-app-id
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://your-prod-project.firebaseio.com
```

## Setup Instructions

### 1. Firebase Setup

1. **Get Firebase CI Token:**
   ```bash
   firebase login:ci
   ```
   This will generate a token. Copy it and add to GitHub Secrets as `FIREBASE_TOKEN`.

2. **Get Firebase Project ID:**
   - Open Firebase Console
   - Go to Project Settings
   - Copy the Project ID
   - Add to GitHub Secrets as `FIREBASE_PROJECT_ID`

3. **Service Account (Optional):**
   - Firebase Console → Project Settings → Service Accounts
   - Generate New Private Key
   - Copy the entire JSON content
   - Add to GitHub Secrets as `FIREBASE_SERVICE_ACCOUNT`

### 2. Vercel Setup

1. **Get Vercel Token:**
   ```bash
   vercel login
   vercel token create
   ```
   Copy the token and add to GitHub Secrets as `VERCEL_TOKEN`.

2. **Get Project and Org IDs:**
   ```bash
   vercel link
   ```
   This creates `.vercel/project.json` with your IDs.
   
   Or get them from Vercel Dashboard:
   - Project Settings → General → Project ID
   - Account Settings → General → User/Team ID
   
   Add to GitHub Secrets:
   - `VERCEL_PROJECT_ID`
   - `VERCEL_ORG_ID`

3. **Configure Environment Variables:**
   - Go to Vercel Dashboard → Project Settings → Environment Variables
   - Add all Firebase configuration variables listed above
   - Set appropriate values for Preview and Production environments

## Deployment Workflow

### Automatic Deployments

The repository uses GitHub Actions for CI/CD:

1. **Pre-deployment Checks** (`prepr-checks.yml`)
   - Runs on all PRs
   - Validates code quality (ESLint, TypeScript)
   - Runs unit tests

2. **Firebase CI** (`firebase-ci.yml`)
   - Runs Firebase-specific tests
   - Validates Firebase configuration

3. **Deploy** (`deploy-firebase-vercel.yml`)
   - Deploys to Firebase (Firestore rules, indexes)
   - Deploys to Vercel (Next.js application)
   - Runs on main branch push

### Manual Deployment

**Deploy to Vercel:**
```bash
vercel --prod
```

**Deploy to Firebase:**
```bash
firebase deploy
```

**Deploy specific Firebase components:**
```bash
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
firebase deploy --only storage
```

## Troubleshooting

### Build Failures

If the build fails with TypeScript or ESLint errors:
- Fix the errors in your code
- Do NOT use `ignoreBuildErrors: true` or `ignoreDuringBuilds: true`
- These settings are disabled in production for safety

### Firebase Deployment Fails

1. Check that `FIREBASE_TOKEN` is valid:
   ```bash
   firebase login:ci
   ```
2. Verify project ID matches your Firebase project
3. Check Firebase Console for any service issues

### Vercel Deployment Fails

1. Verify all environment variables are set correctly
2. Check build logs in Vercel Dashboard
3. Ensure `VERCEL_TOKEN` has appropriate permissions

## Security Notes

- Never commit secrets or tokens to the repository
- Use GitHub Secrets for sensitive data
- Rotate tokens periodically
- Use different Firebase projects for dev/staging/prod
- Keep service account JSON secure and never expose it

## Additional Resources

- [Firebase CLI Documentation](https://firebase.google.com/docs/cli)
- [Vercel CLI Documentation](https://vercel.com/docs/cli)
- [GitHub Actions Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
