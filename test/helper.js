import schema from '../schema';
import sinon from 'sinon';
import expect from 'expect.js';
import { graphql } from 'graphql';

global.schema = schema;
global.expect = expect;
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
  return graphql(schema, query, rootValue).then(result => {
    if (result.errors) {
      const error = result.errors[0];
      throw error.originalError ? error.originalError : error;
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

/**
 * A `expect` test matcher that is used to check if a promise was rejected with a message that
 * matches the given regexp or equals the given string.
 *
 * Note that this matcher *always* expects a promise to be rejected, i.e. it will still fail if the
 * promise resolves and `not` is used.
 *
 * @param {RegExp,String} error The pattern or exact string that the error message should match.
 * @returns {Promise}
 */
expect.Assertion.prototype.rejectedWith = function rejectedWith(error) {
  return this.obj.then(
    () => this.assert(
      this.flags.not,
      () => 'expected promise to be rejected',
      () => 'expected promise to be rejected'
    ),
    ({ message }) => this.assert(
      typeof error === 'string' ? message === error : error.test(message),
      () => 'expected ' + error + ' to match promise rejected with error "' + message + '"',
      () => 'expected ' + error + ' to not match promise rejected with error "' + message + '"',
      message
    )
  );
};

/**
 * A `expect` test matcher that is used to check if a promise was rejected or not.
 *
 * @returns {Promise}
 */
expect.Assertion.prototype.rejected = function rejected() {
  return this.obj.then(
    () => this.assert(
      false,
      () => 'expected promise to be rejected',
      () => 'expected promise to be resolved'
    ),
    () => this.assert(
      true,
      () => 'expected promise to be rejected',
      () => 'expected promise to be resolved'
    )
  );
};

/**
 * A `expect` test matcher that is used to check if a promise was resolved or not.
 *
 * This matcher only exists because just returning a promise from a test that contains no `expect`
 * calls looks a bit lame, but in reality this matcher wouldn’t need to exist, as a test will
 * automatically fail if a returned promise fails. This is also why there’s no `resolvedWith`
 * matcher, because in that case the `resolve` callback of the promise would contain an `expect`
 * call.
 *
 * @returns {Promise}
 */
expect.Assertion.prototype.resolved = function resolved() {
  this.flags.not = !this.flags.not;
  return this.rejected();
};
