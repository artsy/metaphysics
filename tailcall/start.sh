#!/usr/bin/env bash
set -euo pipefail

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

# Write the middleware with the token baked in (QuickJS has no process.env)
cat > "$SCRIPT_DIR/middleware/generated_add-auth-headers.js" << EOF
function onRequest({ request }) {
  request.headers['X-XAPP-TOKEN'] = '${GRAVITY_XAPP_TOKEN}'
  return { request }
}
EOF

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

echo "Tokens fetched, starting Tailcall..."
export ARTNET_ACCESS_TOKEN
exec tailcall start main.yml
