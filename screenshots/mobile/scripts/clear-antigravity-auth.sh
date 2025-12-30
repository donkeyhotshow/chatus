#!/bin/bash

# Script to clear Antigravity IDE authentication data
# This allows you to log in with a different account and get fresh free requests

echo "=== Clearing Antigravity IDE Authentication Data ==="
echo "IMPORTANT: Close Antigravity IDE before running this script!"
read -p "Press Enter after closing Antigravity IDE"

# Determine OS and set paths
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    ANTIGRAVITY_CONFIG="$HOME/Library/Application Support/Antigravity"
    ANTIGRAVITY_CACHE="$HOME/Library/Caches/Antigravity"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    ANTIGRAVITY_CONFIG="$HOME/.config/Antigravity"
    ANTIGRAVITY_CACHE="$HOME/.cache/Antigravity"
else
    echo "Unsupported OS: $OSTYPE"
    exit 1
fi

echo "Clearing authentication data..."

# 1. Clear authentication tokens (specific to Antigravity)
AUTH_TOKENS_PATH="$ANTIGRAVITY_CONFIG/auth-tokens"
if [ -d "$AUTH_TOKENS_PATH" ]; then
    echo "Removing authentication tokens..."
    rm -rf "$AUTH_TOKENS_PATH"
    echo "✓ Authentication tokens removed"
fi

# 2. Clear cookies and network data
NETWORK_PATH="$ANTIGRAVITY_CONFIG/Network"
if [ -d "$NETWORK_PATH" ]; then
    echo "Removing cookies and network data..."
    rm -f "$NETWORK_PATH/Cookies"
    rm -f "$NETWORK_PATH/Cookies-journal"
    rm -f "$NETWORK_PATH/Network Persistent State"
    rm -f "$NETWORK_PATH/Trust Tokens"
    rm -f "$NETWORK_PATH/Trust Tokens-journal"
    echo "✓ Cookies and network data removed"
fi

# 3. Clear session storage
SESSION_PATH="$ANTIGRAVITY_CONFIG/Session Storage"
if [ -d "$SESSION_PATH" ]; then
    echo "Removing session data..."
    rm -rf "$SESSION_PATH"
    echo "✓ Session data removed"
fi

# 4. Clear state database (may contain tokens)
GLOBAL_STORAGE="$ANTIGRAVITY_CONFIG/User/globalStorage"
if [ -d "$GLOBAL_STORAGE" ]; then
    echo "Removing state database..."
    rm -f "$GLOBAL_STORAGE/state.vscdb"
    rm -f "$GLOBAL_STORAGE/state.vscdb.backup"

    # Clean storage.json of potential tokens
    STORAGE_JSON="$GLOBAL_STORAGE/storage.json"
    if [ -f "$STORAGE_JSON" ]; then
        # Create a temporary file without sensitive data
        jq 'del(.["antigravity.authToken"], .["antigravity.sessionToken"])' "$STORAGE_JSON" > "${STORAGE_JSON}.tmp" 2>/dev/null
        if [ $? -eq 0 ]; then
            mv "${STORAGE_JSON}.tmp" "$STORAGE_JSON"
            echo "✓ Sensitive data from storage.json removed"
        else
            rm -f "${STORAGE_JSON}.tmp"
        fi
    fi
    echo "✓ State database cleared"
fi

# 5. Clear workspace storage (may contain cached data)
WORKSPACE_STORAGE="$ANTIGRAVITY_CONFIG/User/workspaceStorage"
if [ -d "$WORKSPACE_STORAGE" ]; then
    echo "Removing workspace storage..."
    # Remove only specific workspaces related to authentication
    for dir in "$WORKSPACE_STORAGE"/*/; do
        if [ -d "$dir" ]; then
            WORKSPACE_FILE="$dir/workspace.json"
            if [ -f "$WORKSPACE_FILE" ]; then
                if grep -q "antigravity.*auth" "$WORKSPACE_FILE" 2>/dev/null; then
                    rm -rf "$dir"
                    echo "✓ Workspace $(basename "$dir") removed (contained authentication data)"
                fi
            fi
        fi
    done
fi

# 6. Clear cache
if [ -d "$ANTIGRAVITY_CACHE" ]; then
    echo "Removing cache..."
    rm -rf "$ANTIGRAVITY_CACHE"
    echo "✓ Cache removed"
fi

# 7. Clear Code Cache (GPU cache)
CODE_CACHE="$ANTIGRAVITY_CONFIG/Code Cache"
if [ -d "$CODE_CACHE" ]; then
    echo "Removing GPU cache..."
    rm -rf "$CODE_CACHE"
    echo "✓ GPU cache removed"
fi

echo ""
echo "=== Cleanup completed! ==="
echo "Now you can launch Antigravity IDE and log in with a different account."
echo "Free requests will be available for the new account."
echo ""
echo "Note: Your settings and extensions will be preserved,"
echo "only authentication and session data will be removed."

read -p "Press Enter to exit"
