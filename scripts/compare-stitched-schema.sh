#! /bin/bash

if ! type "schema_comparator" > /dev/null; then
  echo ""
  echo "Please run 'gem install graphql-schema_comparator'"
  echo ""
  exit 1
fi

mkdir -p tmp
yarn dump-schema _schema.graphql
yarn dump-schema tmp/stitched.graphql

schema_comparator compare  _schema.graphql tmp/stitched.graphql
