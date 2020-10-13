#!/bin/bash
# This assumes you have general prerequisites installed as by:
# https://github.com/artsy/potential/blob/master/scripts/setup

# Exit if any subcommand fails
set -e

if [ ! -z $NVM_DIR ]; then # skip nvm steps if not available
  echo "Configuring node 12"
  source ~/.nvm/nvm.sh
  nvm install
fi

echo 'Install yarn and memchached'
brew bundle

echo 'Using yarn to install required node packages'
yarn install

echo 'Copy the example env to the end file'
cp .env.example .env

echo 'Aws fetch the shared config file'
aws s3 cp s3://artsy-citadel/dev/.env.metaphysics .env.shared

cat .env.shared  > .env

echo 'Now run: yarn dev'
