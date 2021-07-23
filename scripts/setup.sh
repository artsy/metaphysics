#!/bin/bash

# Exit if any subcommand fails
set -e

# This assumes you have general prerequisites installed as by:
# https://github.com/artsy/potential/blob/master/scripts/setup
#
# Run like:
#   ./scripts/setup.sh
#

# Install yarn if it does not exist.
if ! which yarn > /dev/null; then
  echo 'yarn is required for setup, installing with brew...'
  brew install yarn
fi

if ! which memcached > /dev/null; then
  brew install memcached
fi

if [[ ! -z $NVM_DIR ]]; then # skip if nvm is not available
  echo "Installing Node..."
  source ~/.nvm/nvm.sh
  nvm install
fi

echo "Installing dependencies..."
yarn install

if [ -e ".env" ]; then
  echo '.env file already exists, so skipping initialization...'
else
  echo 'Initializing .env from .env.example (for any custom configuration)...'
  cp .env.example .env
fi

echo 'Updating .env.shared file (for shared configuration)...'
aws s3 cp s3://artsy-citadel/dev/.env.metaphysics .env.shared || 'Unable to download shared configuration, ensure you have S3 access!'

echo 'Setup complete! To start the server, run:
  yarn start'
