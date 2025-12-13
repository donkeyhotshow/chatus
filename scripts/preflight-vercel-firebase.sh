#!/usr/bin/env bash
set -euo pipefail

REPORT="preflight-vercel-firebase.json"
status_ok=true

echo "=== preflight-vercel-firebase — quick checks for Vercel & Firebase ==="

echo "- Check vercel.json"
if [ -f vercel.json ]; then
  echo "  vercel.json found"
  if grep -q "\"build\"" vercel.json || grep -q "\"outputDirectory\"" vercel.json; then
    echo "  build/outputDirectory keys present (basic check)"
  else
    echo "  WARNING: vercel.json may not specify build/outputDirectory"
    status_ok=false
  fi
else
  echo "  WARNING: vercel.json not found"
  status_ok=false
fi

echo "- Check Vercel CLI"
if command -v vercel >/dev/null 2>&1; then
  WHOAMI_OUTPUT=$(vercel whoami 2>/dev/null || true)
  if [ -n "$WHOAMI_OUTPUT" ]; then
    echo "  vercel CLI logged in as: $WHOAMI_OUTPUT"
  else
    echo "  WARNING: vercel CLI present but not logged in (run: vercel login)"
    status_ok=false
  fi
else
  echo "  WARNING: vercel CLI not installed"
  status_ok=false
fi

echo "- Check firebase.json"
if [ -f firebase.json ]; then
  echo "  firebase.json found"
else
  echo "  WARNING: firebase.json not found"
  status_ok=false
fi

echo "- Check Firebase CLI"
if command -v firebase >/dev/null 2>&1; then
  echo "  firebase CLI version: $(firebase --version 2>/dev/null || echo unknown)"
else
  echo "  WARNING: firebase CLI not installed"
  status_ok=false
fi

echo "- Check .env.local for essential vars"
missing_env=()
for v in FIREBASE_PROJECT_ID FIREBASE_API_KEY NEXT_PUBLIC_API_URL; do
  if [ -f .env.local ]; then
    if ! grep -q "^${v}=" .env.local; then
      missing_env+=("$v")
    fi
  else
    missing_env+=("$v")
  fi
done
if [ ${#missing_env[@]} -gt 0 ]; then
  echo "  WARNING: missing env vars in .env.local: ${missing_env[*]}"
  status_ok=false
else
  echo "  essential env vars present in .env.local"
fi

overall="PASS"
if [ "$status_ok" = false ]; then
  overall="FAIL"
fi

cat > "$REPORT" <<JSON
{
  "vercel_json": "$( [ -f vercel.json ] && echo "found" || echo "missing" )",
  "vercel_cli_logged_in": "$( [ -n \"$WHOAMI_OUTPUT\" ] && echo "true" || echo "false" )",
  "firebase_json": "$( [ -f firebase.json ] && echo "found" || echo "missing" )",
  "firebase_cli": "$( command -v firebase >/dev/null 2>&1 && echo "installed" || echo "missing" )",
  "missing_env_vars": $(printf '%s\n' "${missing_env[@]}" | python -c "import sys,json; print(json.dumps([l.strip() for l in sys.stdin if l.strip()]))"),
  "overall_status": "$overall"
}
JSON

echo "Preflight finished — report: $REPORT"
if [ "$overall" = "FAIL" ]; then
  echo "One or more checks failed."
  exit 2
fi


