#!/usr/bin/env bash
# Run a browser-harness test scenario against Kalakaarian.
# Usage: BU_CDP_URL=http://127.0.0.1:9222 bash scripts/test-browser.sh <scenario>
# Scenarios: smoke | auth | presence | gallery | marketplace | profile-edit

SCENARIO="${1:-smoke}"
BASE_URL="${KALAKAARIAN_URL:-http://localhost:5173}"

case "$SCENARIO" in

smoke)
browser-harness <<PY
new_tab("$BASE_URL")
wait_for_load()
info = page_info()
print("URL:", info.get("url", "?"))
capture_screenshot()
print("SMOKE PASS — page loaded")
PY
;;

marketplace-auth-gate)
browser-harness <<PY
# Anon user should be redirected away from /marketplace
new_tab("$BASE_URL/marketplace")
wait_for_load()
import time; time.sleep(1)
info = page_info()
url = info.get("url", "")
print("Landed on:", url)
if "/login" in url or "/influencer/" in url or url.rstrip("/") == "$BASE_URL":
    print("PASS — non-brand blocked from marketplace")
else:
    print("FAIL — marketplace accessible without brand login, url:", url)
PY
;;

presence)
echo "Presence test requires a logged-in creator session."
echo "Run interactively: browser-harness and follow kalakaarian.md flow #1"
;;

*)
echo "Unknown scenario: $SCENARIO"
echo "Available: smoke | marketplace-auth-gate | presence"
exit 1
;;

esac
