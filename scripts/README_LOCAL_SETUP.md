Run-local and secrets helper scripts

Files:
- `scripts/run-local.sh` — Bash helper for *nix/mac: env checks, clean, install, start front/back, run tests.
- `scripts/check-secrets.sh` — Bash quick-scan for committed secrets (grep-based).
- `scripts/run-local.ps1` — PowerShell helper for Windows with similar capabilities.
- `scripts/check-secrets.ps1` — PowerShell quick-scan for secrets.

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

Notes:
- These scripts are helpers for local development and don't replace CI or full security scanners.
- Review and adapt uvicorn module path in `run-local` scripts if your backend module is named differently.


