#!/usr/bin/env bash
# Build the static export and deploy it to the VPS.
# Usage: ./scripts/deploy.sh
# Requires: the `lucifers-vps` SSH host alias (root@147.93.138.77).
set -euo pipefail
cd "$(dirname "$0")/.."

HOST=lucifers-vps
WEBROOT=/www/wwwroot/cos.piiix.org

echo "→ building static export"
npm run build

echo "→ syncing out/ to $HOST:$WEBROOT"
rsync -az --delete --exclude '__next.*.txt' out/ "$HOST:$WEBROOT/"
ssh "$HOST" "chown -R www:www $WEBROOT"

echo "→ verifying"
code=$(curl -s -o /dev/null -w '%{http_code}' https://cos.piiix.org/)
echo "https://cos.piiix.org/ -> $code"
[ "$code" = "200" ] || { echo "unexpected status"; exit 1; }
echo "✓ deployed"
