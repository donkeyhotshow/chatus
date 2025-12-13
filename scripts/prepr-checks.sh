#!/usr/bin/env bash
set -euo pipefail

echo "=== scripts/prepr-checks.sh — pre-PR checks (1–4) ==="

DO_FIX=false
REPORT_JSON="prepr-report.json"
if [ "${1:-}" = "--fix" ]; then
  DO_FIX=true
fi

# initialize report fields
node_ok=false
node_version=""
npm_ok=false
python_ok=false
ports_busy=()
check_secrets_status=0
build_status=0


echo "-- 1) Environment checks"
REQUIRED_NODE=20
NODE_VERSION=$(node -v 2>/dev/null || echo "")
if [ -n "$NODE_VERSION" ]; then
  NODE_MAJOR=$(echo "$NODE_VERSION" | sed 's/v\([0-9]*\).*/\1/')
  node_version="$NODE_VERSION"
  if [ "$NODE_MAJOR" -ge "$REQUIRED_NODE" ]; then
    node_ok=true
    echo "✅ Node.js: $NODE_VERSION"
  else
    echo "⚠ Node.js: $NODE_VERSION (required >= $REQUIRED_NODE)"
  fi
else
  echo "⚠ Node.js не найден"
fi

if command -v npm >/dev/null 2>&1; then
  npm_ok=true
  echo "✅ npm: $(npm -v)"
else
  echo "⚠ npm не найден"
fi

if [ -f requirements.txt ]; then
  PY=$(python3 --version 2>&1 || python --version 2>&1 || echo "")
  if [ -n "$PY" ]; then
    python_ok=true
    echo "✅ Python: $PY"
  else
    echo "⚠ Python не найден"
  fi
fi

echo ""
echo "-- Port checks (3000,8000)"
if command -v lsof >/dev/null 2>&1; then
  p3000=$(lsof -i :3000 || true)
  p8000=$(lsof -i :8000 || true)
  if [ -n "$p3000" ]; then
    ports_busy+=("3000")
    echo "Port 3000 busy:"
    echo "$p3000"
  else
    echo "Port 3000 free"
  fi
  if [ -n "$p8000" ]; then
    ports_busy+=("8000")
    echo "Port 8000 busy:"
    echo "$p8000"
  else
    echo "Port 8000 free"
  fi
else
  echo "lsof not available — skip port checks"
fi

echo ""
echo "-- 2) Clean + install (optional; pass --fix to run)"
if $DO_FIX; then
  echo "Cleaning node_modules/.next/dist/.venv..."
  rm -rf node_modules .next dist .venv || true
  echo "Installing npm dependencies..."
  if [ -f package-lock.json ]; then npm ci; else npm install; fi
  if [ -d functions ]; then (cd functions && if [ -f package-lock.json ]; then npm ci; else npm install; fi); fi
else
  echo "Not running clean/install (pass --fix to enable)"
fi

echo ""
echo "-- 3) .env and secrets check"
if [ -f scripts/check-secrets.sh ]; then
  bash scripts/check-secrets.sh || check_secrets_status=$?
else
  echo "scripts/check-secrets.sh not found — skip"
fi

echo ""
echo "-- 4) Build (optional; pass --fix to run build)"
if $DO_FIX; then
  if [ -f package.json ] && grep -q "\"build\"" package.json 2>/dev/null; then
    echo "Building frontend..."
    if npm run build; then
      build_status=0
    else
      build_status=1
      echo "build failed"
    fi
  else
    echo "No build script found — skip"
  fi
  if [ -d functions ]; then
    echo "Building functions (if applicable)..."
    (cd functions && if grep -q "\"build\"" package.json 2>/dev/null; then npm run build || true; fi)
  fi
else
  echo "Not running build (pass --fix to enable)"
fi

echo ""
echo "=== prepr-checks.sh finished ==="
echo ""

# build JSON report (avoid external deps like jq)
ports_json="[]"
if [ ${#ports_busy[@]} -gt 0 ]; then
  ports_json="["
  first=true
  for p in "${ports_busy[@]}"; do
    if [ "$first" = true ]; then
      ports_json="$ports_json\"$p\""
      first=false
    else
      ports_json="$ports_json, \"$p\""
    fi
  done
  ports_json="$ports_json]"
fi

overall="PASS"
if [ "$node_ok" != "true" ] || [ "$npm_ok" != "true" ] || [ "$check_secrets_status" -ne 0 ]; then
  overall="FAIL"
fi

cat > "$REPORT_JSON" <<JSON
{
  "node_ok": $([ "$node_ok" = "true" ] && echo "true" || echo "false"),
  "node_version": "$(echo $node_version | sed 's/"/\\"/g')",
  "npm_ok": $([ "$npm_ok" = "true" ] && echo "true" || echo "false"),
  "python_ok": $([ "$python_ok" = "true" ] && echo "true" || echo "false"),
  "ports_busy": $ports_json,
  "check_secrets_status": $check_secrets_status,
  "build_status": $build_status,
  "overall_status": "$overall"
}
JSON

echo "JSON report written to $REPORT_JSON"


