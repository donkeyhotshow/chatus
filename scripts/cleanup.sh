#!/usr/bin/env bash
set -euo pipefail

echo "Cleaning build artifacts and common caches..."
rm -rf node_modules
rm -rf .next
rm -rf out
rm -rf build
rm -rf .vercel
rm -rf .firebase

echo "Removing common generated files from git (cached) — run this from repo root:"
echo "git rm -r --cached node_modules .next out build .vercel .firebase || true"

echo "If you have service account JSON files, remove them from git history separately (see docs/SECRETS_HANDLING.md)"

echo "Done."

