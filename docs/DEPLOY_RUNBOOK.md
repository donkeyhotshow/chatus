# Deploy runbook — Firebase rules & Vercel

Required GitHub Secrets (Repository → Settings → Secrets and variables → Actions):
- FIREBASE_SERVICE_ACCOUNT — полный JSON сервис-аккаунта (raw JSON)
- FIREBASE_PROJECT_ID — e.g. studio-5170287541-f2fb7
- VERCEL_TOKEN — Vercel personal token (Account → Tokens)

How to run:
1. Push changes to `main` or run this workflow manually (Actions → Deploy Firebase & Vercel → Run workflow).
2. Workflow will:
   - write `FIREBASE_SERVICE_ACCOUNT` to a temp file
   - deploy Firestore/Storage/Realtime DB rules and indexes
   - trigger a Vercel deployment of the current repo state
   - run a basic HTTP smoke test

Rollback:
- If rules caused issues, restore previous rule files from Git history and re-run the workflow.
- To rollback frontend, use Vercel dashboard → Deployments → Promote previous deployment.

Security:
- Do NOT commit service account JSON to the repo.
- Make tokens temporary when possible; revoke after verification.

Troubleshooting:
- If workflow fails on `npm install -g vercel` due to disk/npm issues, ensure runner has enough space or use Vercel GitHub integration instead of CLI step.
- For firebase authentication errors ensure `FIREBASE_SERVICE_ACCOUNT` has roles: `Firebase Admin` or `Editor` for deploy.


