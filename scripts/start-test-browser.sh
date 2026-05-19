#!/usr/bin/env bash
# Starts Windows Chrome with an isolated debug profile on port 9222.
# Sets BU_CDP_URL so browser-harness connects automatically.
# Usage: source scripts/start-test-browser.sh [url]

CHROME="/mnt/c/Program Files/Google/Chrome/Application/chrome.exe"
DEBUG_PORT=9222
PROFILE_DIR="C:\\Temp\\kalakaarian-debug"
TARGET_URL="${1:-http://localhost:5173}"

if ! [ -f "$CHROME" ]; then
  echo "ERROR: Chrome not found at $CHROME"
  exit 1
fi

echo "[browser] Launching Chrome with remote debugging on port $DEBUG_PORT..."
"$CHROME" \
  --remote-debugging-port="$DEBUG_PORT" \
  --user-data-dir="$PROFILE_DIR" \
  --no-first-run \
  --no-default-browser-check \
  "$TARGET_URL" &

export BU_CDP_URL="http://127.0.0.1:$DEBUG_PORT"
echo "[browser] BU_CDP_URL=$BU_CDP_URL"
echo "[browser] Waiting for Chrome to start..."
sleep 3

echo "[browser] Running health check..."
browser-harness <<'PY'
print(page_info())
PY
