#!/usr/bin/env bash
set -euo pipefail

echo "Удаление .next (и опционально node_modules/dist)"
rm -rf .next/ || true
echo ".next удалён."

#!/bin/bash
#
# Remove .next build artifacts from git index (unstage) and ensure .gitignore contains .next
#
set -e

if [ -d ".next" ]; then
  echo "Removing .next from git index..."
  git rm -r --cached .next || true
else
  echo ".next directory not found in repo root"
fi

if ! grep -q "^\\.next" .gitignore 2>/dev/null; then
  echo ".next" >> .gitignore
  echo "Added .next to .gitignore"
else
  echo ".next already in .gitignore"
fi

echo "Done. Commit the change: git add .gitignore && git commit -m 'Remove .next from repo and ignore build artifacts'"


