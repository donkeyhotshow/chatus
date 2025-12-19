Run-local and secrets helper scripts

Files:
- `scripts/run-local.sh` — Bash helper for *nix/mac: env checks, clean, install, start front/back, run tests.
- `scripts/check-secrets.sh` — Bash quick-scan for committed secrets (grep-based).
- `scripts/run-local.ps1` — PowerShell helper for Windows with similar capabilities.
- `scripts/check-secrets.ps1` — PowerShell quick-scan for secrets.
- `scripts/clear-kiro-auth.ps1` — PowerShell script for Windows: clears Kiro IDE authentication data to allow login with different account.
- `scripts/clear-kiro-auth.sh` — Bash script for *nix/mac: clears Kiro IDE authentication data to allow login with different account.
- `scripts/clear-antigravity-auth.ps1` — PowerShell script for Windows: clears Antigravity IDE authentication data to allow login with different account.
- `scripts/clear-antigravity-auth.sh` — Bash script for *nix/mac: clears Antigravity IDE authentication data to allow login with different account.

Quick examples:
- Clean + install:
  - Unix: `./scripts/run-local.sh --clean --install`
  - Windows PS: `.\scripts\run-local.ps1 -Clean -Install`
- Check env:
  - Unix: `./scripts/run-local.sh --check-env`
  - Windows PS: `.\scripts\run-local.ps1 -CheckEnv`
- Start frontend in background (Unix):
  - `./scripts/run-local.sh --start-front`
  - Logs: `.logs/frontend.log`
- Run tests:
  - Unix: `./scripts/run-local.sh --run-tests`
  - Windows: `.\scripts\run-local.ps1 -RunTests`
- Clear Kiro IDE authentication (allows login with different account for free requests):
  - Windows PS: `.\scripts\clear-kiro-auth.ps1`
  - Unix: `./scripts/clear-kiro-auth.sh`
- Clear Antigravity IDE authentication (allows login with different account for free requests):
  - Windows PS: `.\scripts\clear-antigravity-auth.ps1`
  - Unix: `./scripts/clear-antigravity-auth.sh`

Notes:
- These scripts are helpers for local development and don't replace CI or full security scanners.
- Review and adapt uvicorn module path in `run-local` scripts if your backend module is named differently.
- **Kiro auth clearing scripts**: These scripts remove authentication cookies, session data, and cached tokens from Kiro IDE. This allows you to log in with a different account and get fresh free requests. Your settings and extensions remain intact. Always close Kiro IDE before running these scripts.
- **Antigravity auth clearing scripts**: These scripts remove authentication tokens, cookies, session data, and cached tokens from Antigravity IDE. This allows you to log in with a different account and get fresh free requests. Your settings and extensions remain intact. Always close Antigravity IDE before running these scripts.


