#!/bin/bash

# Description: Run this script to build a Hokusai review app for Metaphysics.
# It draws on Artsy's review app docs:
# https://github.com/artsy/hokusai/blob/master/docs/Review_Apps.md
#
# USAGE: $ ./scripts/build_review_app.sh review-app-name

echo "[build_review_app.sh] START"

# Bail out of script on first expression failure and echo the commands as
# they are being run.
set -ev

NAME="$1"

if test -z "$NAME"; then
  echo "You didn't provide a shell argument, so NAME isn't meaningful, exiting."
  exit 1
fi

# Generate the Kubernetes YAML needed to provision the application.
hokusai review_app setup "$NAME"

# Create the Docker image of the current working directory and push it to
# Artsy's docker registry.
#
# --force is needed as the working directory is dirty with (at least) the YAML
# file generated above. --skip-latest as we make no claim this is the "latest"
# build. --tag names the image. This can take ~10 mins.
hokusai registry push --force --skip-latest --overwrite --verbose --tag "$NAME"

# Point the generated YAML at this review app's image and ingress hosts.
./scripts/rewrite_review_app_yaml.sh "$NAME"

# Clean up the namespace if creation fails partway, so the next CI run doesn't
# mistake a partially-created app for a fully running one.
cleanup_on_failure() {
  echo "[build_review_app.sh] Creation failed after namespace was created. Cleaning up namespace $NAME..."
  kubectl --context staging delete namespace "$NAME" || true
}
trap cleanup_on_failure ERR

# Provision the review app.
hokusai review_app create "$NAME" --verbose

# Mark the namespace so the scheduled reaper (scripts/reap-review-apps.sh) can
# find review apps safely and know which branch owns this one.
kubectl --context staging label namespace "$NAME" artsy.io/review-app=true --overwrite
kubectl --context staging annotate namespace "$NAME" \
  artsy.io/review-app-branch="review-app-$NAME" --overwrite

# Metaphysics is a stateless GraphQL API and inherits staging's env via
# `review_app setup`, so no custom env is set here (unlike Force).

# CircleCI's create_review_app_subdomain job creates the matching Cloudflare
# CNAME (metaphysics-$NAME.artsy.net -> nginx-staging-2025.artsy.net). To build
# locally, create that CNAME by hand — see docs/creating-review-apps.md.
echo "[build_review_app.sh] Review app host: metaphysics-$NAME.artsy.net"
echo "[build_review_app.sh] SUCCESS"

exit 0
