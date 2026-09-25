#!/bin/bash

# Description: Run this script to automate the process of building Hokusai
# review application for Metaphysics
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
review_app_file_path="hokusai/$NAME.yml"

# Create the Docker image of your current working direct of Metaphysics, and push
# it to Artsy's docker registry.
#
# --force is needed as the current working directory is dirty with (at least)
# the YAML file generated above.
# --skip-latest as we're making no claim that this is the "latest" build of the
# service.
# --tag to name the image.
hokusai registry push --force --skip-latest --overwrite --verbose --tag "$NAME"

# Edit the K8S YAML to reference the proper Docker image
sed -i.bak "s/metaphysics:staging/metaphysics:$NAME/g" "$review_app_file_path" && rm "$review_app_file_path.bak"

# Edit the K8S YAML Ingress resource to use the Review App's name as the host.
sed -i.bak "s/host: metaphysics-staging.artsy.net/host: metaphysics-$NAME.artsy.net/g" "$review_app_file_path" && rm "$review_app_file_path.bak"

# Provision the review app
hokusai review_app create "$NAME" --verbose

echo "[build_review_app.sh] SUCCESS"

exit 0
