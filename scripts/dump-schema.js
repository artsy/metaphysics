/* eslint-disable no-console */

import fs from 'fs';
import path from 'path';
import schema from '../schema';
import { graphql } from 'graphql';
import { introspectionQuery, printSchema } from 'graphql/utilities';

const destination = process.argv[2];
if (destination === undefined || !fs.existsSync(destination)) {
  console.error('Usage: dump-schema.js /path/to/output/directory');
  process.exit(1);
}

// Save JSON of full schema introspection for Babel Relay Plugin to use
graphql(schema, introspectionQuery).then(result => {
  fs.writeFileSync(
    path.join(destination, 'schema.json'),
    JSON.stringify(result, null, 2)
  );
}, error => {
  console.error(
    'ERROR introspecting schema: ',
    JSON.stringify(error, null, 2)
  );
});

// Save user readable type system shorthand of schema
fs.writeFileSync(
  path.join(destination, 'schema.graphql'),
  printSchema(schema)
);
