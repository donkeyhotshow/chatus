#!/usr/bin/env bash
set -euo pipefail
#
# run-local.sh
# Универсальный скрипт для локальной проверки окружения, установки зависимостей,
# базовой валидации `.env` и (опционально) запуска фронтенда/бэкенда.
#
# Usage:
#   ./scripts/run-local.sh [--clean] [--install] [--check-env] [--start-front] [--start-back] [--run-tests] [--all]
#
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
REQUIRED_NODE_MAJOR=20
REQUIRED_PYTHON_MAJOR=3
REQUIRED_PYTHON_MINOR=11

log() { printf '%s\n' "$*"; }
err() { printf 'ERROR: %s\n' "$*" >&2; }

usage() {
	cat <<EOF
Usage: $0 [--clean] [--install] [--check-env] [--start-front] [--start-back] [--all]

Options:
  --clean       Remove common build artifacts (node_modules, .next, dist, .venv) - prompts before delete
  --install     Run package install (npm install)
  --check-env   Validate presence of required env keys in .env.local or .env
  --start-front Start frontend (npm run dev) in background (logs to .logs/frontend.log)
  --start-back  Start backend (uvicorn ...) in background (logs to .logs/backend.log) if FastAPI detected
  --all         Run clean + install + check-env (does not auto-start servers)
  -h|--help     Show this help
EOF
}

check_node() {
	if ! command -v node >/dev/null 2>&1; then
		err "Node.js not found in PATH"
		return 2
	fi
	local node_ver
	node_ver="$(node -v)" # e.g. v20.3.0
	# extract major number
	local major
	major="$(printf '%s' "$node_ver" | sed -E 's/^v([0-9]+).*/\1/')"
	if [ -z "$major" ] || [ "$major" -lt "$REQUIRED_NODE_MAJOR" ]; then
		err "Node.js major version must be >= ${REQUIRED_NODE_MAJOR}, found ${node_ver}"
		return 3
	fi
	log "Node.js OK: $node_ver"
	return 0
}

check_npm() {
	if ! command -v npm >/dev/null 2>&1; then
		err "npm not found in PATH"
		return 2
	fi
	log "npm OK: $(npm -v)"
	return 0
}

check_python() {
	if ! command -v python >/dev/null 2>&1 && ! command -v python3 >/dev/null 2>&1; then
		log "Python not found, skipping python checks"
		return 0
	fi
	local py_cmd
	if command -v python >/dev/null 2>&1; then
		py_cmd=python
	else
		py_cmd=python3
	fi
	local py_ver
	py_ver="$($py_cmd --version 2>&1)" # e.g. Python 3.11.2
	local major minor
	major="$(printf '%s' "$py_ver" | sed -E 's/^Python ([0-9]+)\..*/\1/')"
	minor="$(printf '%s' "$py_ver" | sed -E 's/^Python [0-9]+\.([0-9]+).*/\1/')"
	if [ -z "$major" ] || [ -z "$minor" ]; then
		err "Unable to parse Python version: $py_ver"
		return 3
	fi
	if [ "$major" -lt "$REQUIRED_PYTHON_MAJOR" ] || { [ "$major" -eq "$REQUIRED_PYTHON_MAJOR" ] && [ "$minor" -lt "$REQUIRED_PYTHON_MINOR" ]; }; then
		err "Python must be >= ${REQUIRED_PYTHON_MAJOR}.${REQUIRED_PYTHON_MINOR}, found ${py_ver}"
		return 4
	fi
	log "Python OK: $py_ver"
	return 0
}

prompt_confirm() {
	local prompt="${1:-Are you sure?}"
	local default="${2:-no}"
	read -r -p "$prompt [y/N]: " response
	case "$response" in
		[Yy]|[Yy][Ee][Ss]) return 0 ;;
		*) return 1 ;;
	esac
}

do_clean() {
	log "This will remove: node_modules/ .next/ dist/ .venv/"
	if prompt_confirm "Remove those directories?"; then
		set +e
		rm -rf node_modules/ .next/ dist/ .venv/
		set -e
		log "Cleaned artifacts."
	else
		log "Skipping clean."
	fi
}

do_install() {
	if command -v npm >/dev/null 2>&1; then
		log "Running npm install..."
		npm install
	else
		err "npm not available; cannot install"
		return 1
	fi
}

check_env_keys() {
	# keys to check - extend if needed
	local keys=(NEXT_PUBLIC_WS_HOST NEXT_PUBLIC_API_URL GH_TOKEN FIREBASE_API_KEY FIREBASE_PROJECT_ID)
	local envfile=""
	if [ -f ".env.local" ]; then
		envfile=".env.local"
	elif [ -f ".env" ]; then
		envfile=".env"
	fi
	if [ -z "$envfile" ]; then
		err "No .env.local or .env file found in project root ($ROOT_DIR)"
		return 2
	fi
	log "Checking keys in ${envfile}..."
	local missing=0
	for k in "${keys[@]}"; do
		if ! grep -E -q "^${k}=" "$envfile"; then
			printf 'MISSING: %s\n' "$k"
			missing=$((missing + 1))
		else
			printf 'OK: %s\n' "$k"
		fi
	done
	if [ "$missing" -gt 0 ]; then
		err "Missing ${missing} env keys — please fill placeholders in ${envfile}"
		return 3
	fi
	log "Env keys check passed."
	return 0
}

check_port_free() {
	local port=$1
	if command -v lsof >/dev/null 2>&1; then
		if lsof -iTCP -sTCP:LISTEN -P | grep -q ":$port\b"; then
			err "Port $port is in use"
			return 1
		fi
	elif command -v ss >/dev/null 2>&1; then
		if ss -ltn | awk '{print $4}' | grep -q ":$port$"; then
			err "Port $port is in use"
			return 1
		fi
	else
		# best effort
		log "Port check skipped (no lsof/ss)"
		return 0
	fi
	return 0
}

start_front() {
	mkdir -p .logs
	check_port_free 3000 || log "Warning: port 3000 may be in use"
	log "Starting frontend: npm run dev (logs -> .logs/frontend.log)"
	# shellcheck disable=SC2086
	npm run dev >> .logs/frontend.log 2>&1 &
	log "Frontend started (bg). PID: $!"
}

start_back() {
	if ! command -v uvicorn >/dev/null 2>&1; then
		log "uvicorn not found; try 'pip install -r requirements.txt' or run backend manually"
		return 2
	fi
	mkdir -p .logs
	check_port_free 8000 || log "Warning: port 8000 may be in use"
	log "Starting backend: uvicorn server_coop_puzzle:app --reload --port 8000 (logs -> .logs/backend.log)"
	uvicorn server_coop_puzzle:app --reload --port 8000 >> .logs/backend.log 2>&1 &
	log "Backend started (bg). PID: $!"
}

main() {
	if [ "$#" -eq 0 ]; then
		usage
		exit 0
	fi
	local do_clean_flag=0
	local do_install_flag=0
	local do_checkenv_flag=0
	local do_startfront_flag=0
	local do_startback_flag=0

	while [ "$#" -gt 0 ]; do
		case "$1" in
			--clean) do_clean_flag=1 ;;
			--install) do_install_flag=1 ;;
			--check-env) do_checkenv_flag=1 ;;
			--start-front) do_startfront_flag=1 ;;
			--start-back) do_startback_flag=1 ;;
			--run-tests) do_runtests_flag=1 ;;
			--all) do_clean_flag=1; do_install_flag=1; do_checkenv_flag=1 ;;
			-h|--help) usage; exit 0 ;;
			*) err "Unknown option: $1"; usage; exit 2 ;;
		esac
		shift
	done

	check_node || true
	check_npm || true
	check_python || true
	# run tests flag default 0
	do_runtests_flag="${do_runtests_flag:-0}"

	if [ "$do_clean_flag" -eq 1 ]; then
		do_clean
	fi
	if [ "$do_install_flag" -eq 1 ]; then
		do_install
	fi
	if [ "$do_checkenv_flag" -eq 1 ]; then
		check_env_keys || true
	fi
	if [ "$do_runtests_flag" -eq 1 ]; then
		run_tests || true
	fi
	if [ "$do_startfront_flag" -eq 1 ]; then
		start_front
	fi
	if [ "$do_startback_flag" -eq 1 ]; then
		start_back
	fi

	log "run-local.sh finished."
}

main "$@"


# Run unit/integration tests (npm/vitest)
run_tests() {
	log "Running JS tests..."
	if command -v npm >/dev/null 2>&1; then
		# Prefer package script if defined
		if npm run | grep -q " test"; then
			npm run test
			return $?
		fi
	fi
	# fallback to vitest if available
	if command -v npx >/dev/null 2>&1; then
		npx vitest run
		return $?
	fi
	err "No test runner found (npm script 'test' or npx vitest)."
	return 4
}


