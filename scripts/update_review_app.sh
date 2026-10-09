#!/bin/bash

# Description: Update an existing review app with the latest changes.
# USAGE: $ ./scripts/update_review_app.sh review-app-name

# Bail out of script on first expression failure and echo the commands as
# they are being run.
set -ev

NAME="$1"

if test -z "$NAME"; then
  echo "You didn't provide a shell argument, so NAME isn't meaningful, exiting."
  exit 1
fi

hokusai registry push --force --skip-latest --overwrite --verbose --tag "$NAME"

# create-yaml regenerates hokusai/$NAME.yml from the staging template, so we must
# re-apply the image + ingress-host rewrite before deploying (otherwise the update
# would redeploy staging hosts).
hokusai review_app create-yaml "$NAME"
./scripts/rewrite_review_app_yaml.sh "$NAME"

hokusai review_app deploy "$NAME" "$NAME"

# Restamp the deploy time (this push renews the lease) and backfill the
# label/branch annotation in case this app predates them (idempotent).
kubectl --context staging label namespace "$NAME" artsy.io/review-app=true --overwrite
kubectl --context staging annotate namespace "$NAME" \
  artsy.io/review-app-branch="review-app-$NAME" \
  artsy.io/review-app-deployed-at="$(date +%s)" --overwrite
