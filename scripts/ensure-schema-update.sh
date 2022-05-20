#!/bin/sh

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
NO_COLOR='\033[0m'

MSG_CLEAN="\n${GREEN}Schema is up-to-date.${NO_COLOR}"
MSG_DRIFT="\n${RED}Schema is outdated. You might want to run \`yarn dump:staging\` and commit the changes.${NO_COLOR}"

yarn dump:staging

if [ -z "$(git status _schemaV2.graphql --porcelain)" ]; then
  echo "$MSG_CLEAN"
else
  echo "$MSG_DRIFT" && exit 1
fi
