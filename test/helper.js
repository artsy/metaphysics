// Do not require the use of node-foreman during testing
import dotenv from 'dotenv';
dotenv.config({ path: '.env.test' });

import schema from '../schema';
import sinon from 'sinon';

import { graphql } from 'graphql';
// Set up our globals
global.schema = schema;
global.sinon = sinon;

/**
 * Performs a GraphQL query against our schema.
 *
 * On success, the promise resolves with the `data` part of the resonse.
 *
 * On error, the promise will reject with the original error that was thrown.
 *
 * @param {String} query      The GraphQL query to run.
 * @param {Object} rootValue  The request params, which currently are `accessToken` and `userID`.
 * @returns {Promise}
 *
 * @todo This assumes there will always be just 1 error, not sure how to handle this differently.
 */
global.runQuery = (query, rootValue = { accessToken: null, userID: null }) => {
  return graphql(schema, query, rootValue, {}).then(result => {
    if (result.errors) {
      const error = result.errors[0];
      throw error.originalError || error;
    } else {
      return Promise.resolve(result.data);
    }
  });
};

/**
 * Same as `runQuery` except it provides a `rootValue` that’s required for authenticated queries.
 *
 * @see runQuery
 */
global.runAuthenticatedQuery = (query) => {
  return runQuery(query, { accessToken: 'secret', userID: 'user-42' });
};

// // We want to silence the console output from node-uuid, so we use a mocked module
// // at __mocks__/node-uuid.js which has it's console muted
jest.mock('node-uuid');
