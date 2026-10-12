#!/bin/bash

# Description: Delete a review app — its Kubernetes namespace and its Cloudflare
# CNAME. Run this as soon as QA is complete.
# USAGE: $ yarn delete-review-app awesome-feature

set -e

NAME="$1"

if test -z "$NAME"; then
  echo "USAGE: yarn delete-review-app <name>   (name without the review-app- prefix)"
  exit 1
fi

# Tolerate being passed the full branch name.
NAME="${NAME#review-app-}"

echo "Deleting namespace $NAME..."
kubectl --context staging delete namespace "$NAME"

if test -n "$CLOUDFLARE_API_TOKEN" && test -n "$CLOUDFLARE_ZONE_ID"; then
  echo "Deleting Cloudflare CNAME metaphysics-$NAME.artsy.net..."
  node scripts/delete-review-app-subdomain.js "$NAME"
else
  echo "CLOUDFLARE_API_TOKEN / CLOUDFLARE_ZONE_ID not set."
  echo "Delete the CNAME metaphysics-$NAME.artsy.net manually in Cloudflare (artsy.net > DNS)."
fi
