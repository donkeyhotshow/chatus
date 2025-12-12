#!/usr/bin/env bash
set -euo pipefail
#
# check-secrets.sh
# Простейший скрипт для поиска потенциально закоммиченных секретов и .env файлов.
# Не заменяет полноценный инструмент типа `git-secrets` или `truffleHog`, но даёт быстрый
# локальный обзор.
#
# Usage:
#   ./scripts/check-secrets.sh

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

log() { printf '%s\n' "$*"; }
err() { printf 'ERROR: %s\n' "$*" >&2; }

patterns=(
	"GH_TOKEN"
	"FIREBASE_API_KEY"
	"FIREBASE_"
	"PRIVATE_KEY"
	"BEGIN PRIVATE KEY"
	"SECRET_KEY"
	"API_KEY"
	"aws_secret_access_key"
	"AKIA[0-9A-Z]{16}"
)

found=0

log "Checking committed files for suspicious patterns..."
for p in "${patterns[@]}"; do
	printf '--- Searching for: %s\n' "$p"
	# use grep over tracked files (binary files ignored)
	if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
		git grep -n -I -E "$p" -- || true
	else
		grep -RIn --exclude-dir=.git -E "$p" . || true
	fi
done

log
log "Checking for common env files tracked in git:"
if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
	git ls-files | grep -E '\.env($|\.|$)' || log "No env files committed."
else
	find . -maxdepth 3 -type f -name '.env*' -print || true
fi

log
log "Searching for PEM/private key blocks in repository (BEGIN PRIVATE KEY)..."
if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
	if git grep -n -I "BEGIN PRIVATE KEY" -- || true; then
		found=1
	fi
else
	if grep -RIn --exclude-dir=.git "BEGIN PRIVATE KEY" . || true; then
		found=1
	fi
fi

log
if [ "$found" -ne 0 ]; then
	err "Potential secrets found. Review the output above and remove/rotate any exposed keys."
	exit 1
else
	log "Quick scan complete — no obvious private-key blocks found. This is not a guarantee!"
fi

log "Tips:"
log "- If you find secrets: remove them, add them to .gitignore, rotate keys, and create a PR with the fix."
log "- Consider installing `git-secrets` and/or `truffleHog` for deeper scans."


