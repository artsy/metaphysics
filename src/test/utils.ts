// Please do not add schema imports here while stitching is an ENV flag
//
import { graphql, GraphQLError } from "graphql"
import { ResolverContext } from "types/graphql"

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
  context: Partial<ResolverContext> = {
    accessToken: undefined,
    userID: undefined,
  }
) => {
  const schema = require("schema").default

  // TODO: fix this
  // Set up some of the default state when a request is made
  // context.res = context.res || {}
  // context.res.locals = context.res.locals || {}
  // context.res.locals.requestIDs = context.res.locals.requestIDs || {
  //   requestID: "123456789",
  //   xForwardedFor: "123.456.789",
  // }

  return graphql(schema, query, null, context).then(result => {
    if (result.errors) {
      const errors = result.errors.reduce(
        (acc, gqlError) => {
          const error = unpackGraphQLError(gqlError) as Error | CombinedError
          return isCombinedError(error)
            ? [...acc, ...error.errors.map(unpackGraphQLError)]
            : [...acc, error]
        },
        [] as Error[]
      )
      if (errors.length === 1) {
        throw errors[0]
      } else {
        const combinedError = new Error("Multiple errors occurred.")
        combinedError.stack = errors
          .map(e => `${e.message}:\n${e.stack}`)
          .join("\n")
        throw combinedError
      }
    } else {
      return result.data
    }
  })
}

// This is an error class defined in https://github.com/apollographql/graphql-tools/blob/3f87d907af2ac97a32b5ab375bb97198ebfe9e2c/src/stitching/errors.ts#L87-L93
declare class CombinedError extends Error {
  public errors: ReadonlyArray<GraphQLError>
}

const isCombinedError = (
  error: Error | CombinedError
): error is CombinedError => error.hasOwnProperty("errors")

const unpackGraphQLError = (error: GraphQLError) => error.originalError || error

/**
 * Same as `runQuery` except it provides a `rootValue` that’s required for authenticated queries.
 *
 * @param {String} query      The GraphQL query to run.
 * @param {Object} rootValue  The request params, which currently are `accessToken` and `userID`.
 * @see runQuery
 */
export const runAuthenticatedQuery = (
  query,
  context: Partial<ResolverContext> = {}
) => {
  return runQuery(query, {
    accessToken: "secret",
    userID: "user-42",
    ...context,
  })
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
      ENABLE_COMMERCE_STITCHING: true,
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
