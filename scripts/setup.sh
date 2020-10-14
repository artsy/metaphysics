# This assumes you have general prerequisites installed as by:
# https://github.com/artsy/potential/blob/master/scripts/setup
#
# Run like:
#   source scripts/setup.sh
#
# Commands that may fail have "|| return" to avoid continuing or interfering with terminal.

if [ ! -z $NVM_DIR ]; then # skip nvm steps if not available
  echo 'Configuring node 12...'
  source ~/.nvm/nvm.sh
  nvm install || return
fi

echo 'Installing yarn and memcached...'
brew bundle || return

echo 'Installing node packages...'
yarn install || return

if [ -e ".env" ]; then
  echo '.env file already exists, so skipping initialization...'
else
  echo 'Initializing .env from .env.example (for any custom configuration)...'
  cp .env.example .env
fi

echo 'Updating .env.shared file (for shared configuration)...'
aws s3 cp s3://artsy-citadel/dev/.env.metaphysics .env.shared || return

echo 'Setup complete! To start the server on localhost:3000, run:
  yarn dev'
