#!/bin/bash

# Exit if any subcommand fails
set -e

# This assumes you have general prerequisites installed as by:
# https://github.com/artsy/potential/blob/master/scripts/setup
#
# Run like:
#   ./scripts/setup.sh
#

if ! which memcached > /dev/null; then
  brew install memcached
fi

if command -v mise >/dev/null; then
  echo "Installing language dependencies with mise"
  mise install
else
  echo "Skipping language dependencies installation (mise not found)"
fi

echo "Installing dependencies..."
yarn install || (npm install --global yarn@latest && yarn install)

if [ -e ".env" ]; then
  echo '.env file already exists, so skipping initialization...'
else
  echo 'Initializing .env from .env.example (for any custom configuration)...'
  cp .env.example .env
fi

echo 'Updating .env.shared file (for shared configuration)...'
aws s3 cp s3://artsy-citadel/metaphysics/.env.shared ./ || 'Unable to download shared configuration, ensure you have S3 access!'

echo 'Setup complete! To start the server, run:
  yarn start'
