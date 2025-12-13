# 🚀 Deployment Guide

This guide covers all deployment-related configurations, secrets, and environment variables for the Chatus application.

## Table of Contents
- [Required GitHub Secrets](#required-github-secrets)
- [Vercel Environment Variables](#vercel-environment-variables)
- [Local Development Setup](#local-development-setup)
- [Deployment Workflows](#deployment-workflows)
- [Security Best Practices](#security-best-practices)

---

## Required GitHub Secrets

### Firebase

Add these secrets in your GitHub repository: **Settings → Secrets and variables → Actions → New repository secret**

#### `FIREBASE_TOKEN`
Firebase CI token for automated deployments.

**How to obtain:**
```bash
npm install -g firebase-tools
firebase login
firebase login:ci
```
Copy the generated token and add it to GitHub Secrets as `FIREBASE_TOKEN`.

#### `FIREBASE_PROJECT_ID`
Your Firebase project identifier (e.g., `my-app-prod` or `chatus-prod`).

**How to find:**
- Firebase Console → Project Settings → Project ID
- Or check your `.firebaserc` file

#### `FIREBASE_SERVICE_ACCOUNT` (Optional)
Service account JSON for advanced Firebase operations.

**How to obtain:**
```bash
# Firebase Console → Project Settings → Service Accounts → Generate New Private Key
```
Add the entire JSON content as a single-line string to GitHub Secrets.

---

### Vercel

#### `VERCEL_TOKEN`
Vercel authentication token for deployment automation.

**How to obtain:**
```bash
# Option 1: Via CLI
npm install -g vercel
vercel login
vercel token create

# Option 2: Via Dashboard
# Vercel Dashboard → Settings → Tokens → Create Token
```
Copy the token and add it to GitHub Secrets as `VERCEL_TOKEN`.

#### `VERCEL_PROJECT_ID`
Project identifier from Vercel.

**How to find:**
```bash
# Via CLI (in project directory)
vercel link
cat .vercel/project.json

# Via Dashboard
# Vercel → Project → Settings → General → Project ID
```

#### `VERCEL_ORG_ID`
Organization or Team ID from Vercel.

**How to find:**
```bash
# Via CLI (in project directory)
vercel link
cat .vercel/project.json

# Via Dashboard
# Vercel → Settings → General → Your Team/Personal Account ID
```

---

## Vercel Environment Variables

Configure these in: **Vercel Dashboard → Project → Settings → Environment Variables**

### Firebase Configuration (Required for all environments)

Set these variables for both **Preview** (dev/staging) and **Production** environments:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://your_project.firebaseio.com
```

**How to find these values:**
- Firebase Console → Project Settings → General → Your apps → Firebase SDK snippet → Config

### Environment-Specific Configuration

#### Preview (Development/Staging)
```env
# Use development Firebase project
NEXT_PUBLIC_FIREBASE_PROJECT_ID=chatus-dev
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://chatus-dev.firebaseio.com
```

#### Production
```env
# Use production Firebase project
NEXT_PUBLIC_FIREBASE_PROJECT_ID=chatus-prod
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://chatus-prod.firebaseio.com
```

---

## Local Development Setup

### 1. Clone and Install
```bash
git clone https://github.com/username/your-project.git
cd your-project
npm ci
```

### 2. Configure Environment
```bash
# Copy example environment file
cp env.example .env.local

# Edit .env.local with your Firebase config
nano .env.local
```

### 3. Firebase Setup
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Link to your project
firebase use --add

# Start emulators (optional, for local testing)
firebase emulators:start
```

### 4. Start Development Server
```bash
npm run dev
```

Visit http://localhost:3000

---

## Deployment Workflows

### Automated Deployment (Recommended)

The repository uses GitHub Actions for CI/CD:

#### `firebase-ci.yml`
Runs on pull requests to validate code quality:
- Builds the project
- Runs unit tests
- Validates Firebase rules

#### `deploy-firebase-vercel.yml`
Deploys to production on push to `main`:
- Deploys Firebase (Firestore, Storage, Functions)
- Deploys to Vercel
- Updates indexes and rules

### Manual Deployment

#### Deploy Firebase Only
```bash
# Deploy all Firebase services
firebase deploy --project your-project-id

# Deploy specific services
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
firebase deploy --only storage
firebase deploy --only functions
```

#### Deploy Vercel Only
```bash
# Deploy to production
vercel --prod --token $VERCEL_TOKEN

# Deploy preview
vercel --token $VERCEL_TOKEN
```

#### Deploy Both (Manual)
```bash
# 1. Deploy Firebase
firebase deploy --project your-project-id

# 2. Deploy Vercel
vercel --prod --token $VERCEL_TOKEN
```

---

## Security Best Practices

### ✅ DO:
- Store all secrets in GitHub Secrets or Vercel Environment Variables
- Use different Firebase projects for development/staging/production
- Rotate tokens regularly (every 90 days recommended)
- Use service accounts with minimal required permissions
- Enable Firebase security rules for all services
- Review deployment logs for sensitive information

### ❌ DON'T:
- Never commit `.env`, `.env.local`, or `.env.production` to git
- Never share tokens in chat, email, or documentation
- Never use production credentials in development
- Never disable TypeScript or ESLint checks in production builds
- Never grant global read/write access in Firebase rules

### Secret Detection
The repository includes `scripts/check-secrets.sh` for detecting accidentally committed secrets:

```bash
# Run locally before committing
./scripts/check-secrets.sh

# Configure git hook (optional)
cp .githooks/pre-commit .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```

---

## Troubleshooting

### Firebase Deployment Fails
```bash
# Check if you're logged in
firebase login --reauth

# Verify project selection
firebase use --list

# Check token validity
firebase login:ci
```

### Vercel Deployment Fails
```bash
# Check token validity
vercel whoami --token $VERCEL_TOKEN

# Re-link project
vercel link

# Check environment variables
vercel env ls
```

### Build Fails with TypeScript/ESLint Errors
```bash
# Run type check locally
npm run type-check

# Run linter
npm run lint

# Fix auto-fixable issues
npm run lint:fix
```

**Note:** As of the latest configuration, `ignoreBuildErrors` and `ignoreDuringBuilds` are set to `false` in `next.config.js`. This means builds will fail if there are TypeScript or ESLint errors, ensuring production code quality.

---

## Testing Deployment

### Run Tests Locally
```bash
# Unit tests
npm run test:unit

# Firebase-specific tests
npm run test:firebase

# Watch mode (for development)
npm run test:watch

# Coverage report
npm run test:coverage
```

### Validate Firebase Rules
```bash
# Start emulators
firebase emulators:start

# In another terminal, run tests
npm run test:emulator
```

---

## Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [GitHub Actions](https://docs.github.com/en/actions)

---

**Last Updated:** 2025-12-13
