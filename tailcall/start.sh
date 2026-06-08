#!/usr/bin/env bash
set -euo pipefail

OPTION1="${1:-}"
if [ "$OPTION1" = "--log-tokens" ]; then
  SHOULD_LOG_TOKENS=true
else
  SHOULD_LOG_TOKENS=false
fi

OIDC_ISSUER="https://login.artnet-dev.com"
OIDC_CLIENT_ID="shared-client-new-stack"
OIDC_CLIENT_SECRET="password"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "Fetching Gravity xapp token..."
GRAVITY_XAPP_TOKEN=$(node "$SCRIPT_DIR/fetch-xapp-token.js")

if [ -z "$GRAVITY_XAPP_TOKEN" ]; then
  echo "Error: failed to fetch xapp token" >&2
  exit 1
fi

if [ "$SHOULD_LOG_TOKENS" = true ]; then
  echo "Gravity access token: $GRAVITY_XAPP_TOKEN"
fi

# Write the middleware with the token baked in (QuickJS has no process.env)
cat > "$SCRIPT_DIR/generated/middleware.js" << EOF
function onRequest({ request }) {
  request.headers['X-XAPP-TOKEN'] = '${GRAVITY_XAPP_TOKEN}'
  return { request }
}
EOF

# Append static middleware functions (not safe to put in generated file directly)
cat "$SCRIPT_DIR/middleware/artworks-to-connection.js" >> "$SCRIPT_DIR/generated/middleware.js"

echo "Fetching Artnet access token..."
ARTNET_ACCESS_TOKEN=$(curl -sf -X POST "$OIDC_ISSUER/connect/token" \
  -H "content-type: application/x-www-form-urlencoded" \
  -d "client_id=$OIDC_CLIENT_ID&client_secret=$OIDC_CLIENT_SECRET&grant_type=client_credentials" \
  | grep -o '"access_token":"[^"]*"' \
  | cut -d'"' -f4)

if [ -z "$ARTNET_ACCESS_TOKEN" ]; then
  echo "Error: failed to fetch access token" >&2
  exit 1
fi

if [ "$SHOULD_LOG_TOKENS" = true ]; then
  echo "Artnet access token: $ARTNET_ACCESS_TOKEN"
fi

echo "Tokens fetched, starting Tailcall..."
export ARTNET_ACCESS_TOKEN
exec tailcall start main.yml
