# This assumes you have general prerequisites installed as by:
# https://github.com/artsy/potential/blob/master/scripts/setup
#
# Run like:
#   source scripts/setup.sh
#
# Commands that may fail have "|| return" to avoid continuing or interfering with terminal.

# Install yarn if it does not exist.
if ! which yarn > /dev/null; then
  echo 'yarn is required for setup, installing...'
  if ! which brew > /dev/null; then
    echo 'brew is required to install yarn, see https://docs.brew.sh/Installation'
    exit 0
  fi
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
yarn install || echo 'Unable to install dependencies using yarn!'

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
