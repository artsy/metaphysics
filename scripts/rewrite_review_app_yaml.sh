#!/bin/bash

# Rewrite a hokusai-generated review-app YAML in place so it points at this
# review app's Docker image and at review-app-scoped ingress hosts.
#
# Metaphysics' staging ingress declares three hosts (metaphysics-staging,
# metaphysics-cdn-staging, metaphysics-staging-alt). Each must be rewritten,
# otherwise the review app's ingress would claim a real staging hostname and
# hijack staging traffic. Only metaphysics-$NAME.artsy.net gets a CNAME; the
# cdn/alt hosts simply won't resolve, which is fine for a review app.
#
# Shared by build_review_app.sh and update_review_app.sh so the two paths can't drift.
# USAGE: $ ./scripts/rewrite_review_app_yaml.sh review-app-name

set -ev

NAME="$1"

if test -z "$NAME"; then
  echo "[rewrite_review_app_yaml.sh] No NAME provided, exiting."
  exit 1
fi

review_app_file_path="hokusai/$NAME.yml"

# Point the app image (not the shared fortress sidecar) at this review app's tag.
sed -i.bak "s/metaphysics:staging/metaphysics:$NAME/g" "$review_app_file_path" && rm "$review_app_file_path.bak"

# Rewrite every staging ingress host. Order matters: the more specific hosts
# must be rewritten before the bare metaphysics-staging host.
sed -i.bak \
  -e "s/metaphysics-staging-alt.artsy.net/metaphysics-staging-alt-$NAME.artsy.net/g" \
  -e "s/metaphysics-cdn-staging.artsy.net/metaphysics-cdn-$NAME.artsy.net/g" \
  -e "s/metaphysics-staging.artsy.net/metaphysics-$NAME.artsy.net/g" \
  "$review_app_file_path" && rm "$review_app_file_path.bak"

# Safety net: abort if any staging host survived, rather than risk hijacking staging.
if grep -qF "staging.artsy.net" "$review_app_file_path"; then
  echo "[rewrite_review_app_yaml.sh] ERROR: a staging host remains in $review_app_file_path; aborting."
  grep -nF "staging.artsy.net" "$review_app_file_path"
  exit 1
fi
