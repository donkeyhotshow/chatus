#!/usr/bin/env bash
set -euo pipefail
#
# Install project git hooks by configuring core.hooksPath to .githooks
#
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "Not a git repository. Initialize git first."
  exit 1
fi

git config core.hooksPath .githooks
chmod +x .githooks/pre-commit || true
echo "Installed git hooks (core.hooksPath -> .githooks)."
echo "To revert: git config --unset core.hooksPath"


