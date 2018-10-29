// Please do not add schema imports here while stitching is an ENV flag
//
import { graphql } from "graphql"

/**
 * Performs a GraphQL query against our schema.
 *
 * On success, the promise resolves with the `data` part of the response.
 *
 * On error, the promise will reject with the original error that was thrown.
 *
 * @param {String} query      The GraphQL query to run.
 * @param {Object} rootValue  The request params, which currently are `accessToken` and `userID`.
 * @returns {Promise}
 *
 * @todo This assumes there will always be just 1 error, not sure how to handle this differently.
 */
export const runQuery = (
  query,
  rootValue = { accessToken: null, userID: null },
  context: any = {}
) => {
  const schema = require("schema").default

  // Set up some of the default state when a request is made
  context.res = context.res || {}
  context.res.locals = context.res.locals || {}
  context.res.locals.requestIDs = context.res.locals.requestIDs || {
    requestID: "123456789",
    xForwardedFor: "123.456.789",
  }

  return graphql(schema, query, rootValue, context).then(result => {
    if (result.errors) {
      const error = result.errors[0]
      throw error.originalError || error
    } else {
      return result.data
    }
  })
}

/**
 * Same as `runQuery` except it provides a `rootValue` that’s required for authenticated queries.
 *
 * @param {String} query      The GraphQL query to run.
 * @param {Object} rootValue  The request params, which currently are `accessToken` and `userID`.
 * @see runQuery
 */
export const runAuthenticatedQuery = (
  query,
  rootValue: any = {},
  context = {}
) => {
  return runQuery(
    query,
    Object.assign({ accessToken: "secret", userID: "user-42" }, rootValue),
    context
  )
}

let mergedSchema

// TODO: runQueryMerged could be removed now?

/**
 * Same as `runQuery`, but runs against stitched schema
 *
 * @param {String} query      The GraphQL query to run.
 * @param {Object} rootValue  The request params, which currently are `accessToken` and `userID`.
 * @see runQuery
 */
export const runQueryMerged = async (
  query,
  rootValue = { accessToken: null, userID: null }
) => {
  const { incrementalMergeSchemas } = require("lib/stitching/mergeSchemas")

  if (!mergedSchema) {
    mergedSchema = await incrementalMergeSchemas({
      ENABLE_ECOMMERCE_STITCHING: true,
      ENABLE_CONSIGNMENTS_STITCHING: true,
    })
  }
  return graphql(mergedSchema, query, rootValue, {}).then(result => {
    if (result.errors) {
      const error = result.errors[0]
      throw error.originalError || error
    } else {
      return result.data
    }
  })
}
