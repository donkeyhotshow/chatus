#!/usr/bin/env bash
set -euo pipefail

echo "=== scripts/check-secrets.sh — проверка .env и возможных секретов в репо ==="

REPO_ROOT="$(pwd)"

# 1) Проверка наличия .env.local
if [ -f ".env.local" ]; then
  echo "Найден .env.local (локальные секреты). Убедитесь, что он в .gitignore."
  if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    if git ls-files --error-unmatch .env.local >/dev/null 2>&1; then
      echo "ERROR: .env.local закоммичен в репозиторий! Уберите его и сделайте git rm --cached .env.local"
      FOUND_TRACKED_ENV=true
    else
      FOUND_TRACKED_ENV=false
    fi
  else
    echo "Не git-репозиторий — пропускаем проверку трекинга .env.local."
    FOUND_TRACKED_ENV=false
  fi
else
  echo "Файл .env.local не найден."
  FOUND_TRACKED_ENV=false
fi

echo ""
echo "Поиск потенциальных секретов в файловом дереве (исключая .git)"

# patterns to search for (case-insensitive)
PATTERNS=(
  "FIREBASE_API_KEY"
  "API_KEY"
  "SECRET"
  "PRIVATE_KEY"
  "AWS_SECRET_ACCESS_KEY"
  "GITHUB_TOKEN"
  "TOKEN="
)

FOUND_ANY=false
for p in "${PATTERNS[@]}"; do
  # show matches but ignore common build artifacts and node_modules
  if grep -R --line-number --exclude-dir=.git --exclude-dir=node_modules --exclude-dir=.github --exclude-dir=.githooks --exclude-dir=.next --exclude-dir=dist --exclude-dir=build --exclude-dir=.vercel --exclude-dir=docs --exclude-dir=scripts --exclude=check-secrets.* --exclude=env.example --exclude=README.md --exclude=pr_body.md --exclude=DEPLOYMENT_READY.md --exclude=prepr-report.json -i -n "$p" . 2>/dev/null | grep -v "process\.env\." | grep -v "\${{" >/dev/null 2>&1; then
    echo "Matches for pattern '$p':"
    grep -R --line-number --exclude-dir=.git --exclude-dir=node_modules --exclude-dir=.github --exclude-dir=.githooks --exclude-dir=.next --exclude-dir=dist --exclude-dir=build --exclude-dir=.vercel --exclude-dir=docs --exclude-dir=scripts --exclude=check-secrets.* --exclude=env.example --exclude=README.md --exclude=pr_body.md --exclude=DEPLOYMENT_READY.md --exclude=prepr-report.json -i -n "$p" . 2>/dev/null | grep -v "process\.env\." | grep -v "\${{" 
    FOUND_ANY=true
  fi
done

echo ""
if $FOUND_ANY; then
  echo "Внимание: найдены потенциальные секреты/ключи. Проверьте вывод выше и удалите/переместите в безопасное хранилище."
else
  echo "Не найдено очевидных секретов по базовым паттернам."
fi

if $FOUND_TRACKED_ENV || $FOUND_ANY; then
  echo "Результат: FAIL (найдены потенциальные секреты или .env.local закоммичен)"
  exit 2
else
  echo "Результат: OK"
  exit 0
fi

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
		git grep -n -I -E "$p" -- ':!.github' ':!.next' ':!dist' ':!build' ':!.vercel' ':!docs' ':!scripts' ':!**/check-secrets.*' ':!env.example' ':!README.md' ':!pr_body.md' || true
	else
		grep -RIn --exclude-dir=.git --exclude-dir=.github --exclude-dir=.next --exclude-dir=dist --exclude-dir=build --exclude-dir=.vercel --exclude-dir=docs --exclude-dir=scripts --exclude=check-secrets.* --exclude=env.example --exclude=README.md --exclude=pr_body.md -E "$p" . || true
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
	if git grep -n -I "BEGIN PRIVATE KEY" -- ':!.github' ':!.next' ':!dist' ':!build' ':!.vercel' ':!docs' ':!scripts' ':!**/check-secrets.*' ':!env.example' ':!README.md' ':!pr_body.md' || true; then
		found=1
	fi
else
	if grep -RIn --exclude-dir=.git --exclude-dir=.github --exclude-dir=.next --exclude-dir=dist --exclude-dir=build --exclude-dir=.vercel --exclude-dir=docs --exclude-dir=scripts --exclude=check-secrets.* --exclude=env.example --exclude=README.md --exclude=pr_body.md "BEGIN PRIVATE KEY" . || true; then
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


