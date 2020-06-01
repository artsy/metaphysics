// Please do not add schema imports here while stitching is an ENV flag
//
import { graphql, GraphQLError, GraphQLArgs } from "graphql"
import { ResolverContext } from "types/graphql"
import { createLoadersWithAuthentication } from "lib/loaders/loaders_with_authentication"
import localSchema from "schema/v1/schema"

export const runQueryOrThrow = (args: GraphQLArgs) => {
  return graphql(args).then((result) => {
    if (result.errors) {
      const errors = result.errors.reduce((acc, gqlError) => {
        const error = unpackGraphQLError(gqlError) as Error | CombinedError
        return isCombinedError(error)
          ? [...acc, ...error.errors.map(unpackGraphQLError)]
          : [...acc, error]
      }, [] as Error[])
      if (errors.length === 1) {
        throw errors[0]
      } else {
        const combinedError = new Error("Multiple errors occurred.")
        combinedError.stack = errors
          .map((e) => `${e.message}:\n${e.stack}`)
          .join("\n")
        throw combinedError
      }
    } else {
      return result.data!
    }
  })
}

/**
 * Performs a GraphQL query against our schema.
 *
 * On success, the promise resolves with the `data` part of the response.
 *
 * On error, the promise will reject with the original error that was thrown.
 *
 * @param query   The GraphQL query to run.
 * @param context The request specific data, such as `userID` and data-loaders.
 *
 * @todo This assumes there will always be just 1 error, not sure how to handle this differently.
 */
export const runQuery = (
  query,
  context: Partial<ResolverContext> = {
    accessToken: undefined,
    userID: undefined,
  },
  variableValues: { [variableName: string]: any } = {}
) => {
  const schema = require("schema/v1").default
  return runQueryOrThrow({
    schema,
    source: query,
    contextValue: {
      requestIDs: {
        requestID: "123456789",
        xForwardedFor: "123.456.789",
        ...context.requestIDs,
      },
      ...context,
    },
    variableValues,
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
 * Same as `runQuery` except it simulates an authenticated request.
 *
 * It provides mocks for all authenticated loaders so that tests don’t need to
 * provide those for resolvers that test for the existence of some authenticated
 * loaders not under test.
 *
 * @param query   The GraphQL query to run.
 * @param context The request specific data, such as `userID` and data-loaders.
 * @see runQuery
 */
export const runAuthenticatedQuery = (
  query,
  context: Partial<ResolverContext> = {}
) => {
  const accessToken = "secret"
  const userID = "user-42"
  const loaders = createLoadersWithAuthentication(accessToken, userID, {})
  Object.keys(loaders).forEach((key) => (loaders[key] = jest.fn()))
  return runQuery(query, {
    accessToken,
    userID,
    ...loaders,
    ...context,
  })
}

let mergedSchema

// TODO: runQueryMerged could be removed now?

/**
 * Same as `runQuery`, but runs against stitched schema
 *
 * @param query   The GraphQL query to run.
 * @param context The request specific data, such as `userID` and data-loaders.
 * @see runQuery
 */
export const runQueryMerged = async (
  query,
  context: Partial<ResolverContext> = {}
) => {
  const { incrementalMergeSchemas } = require("lib/stitching/mergeSchemas")

  if (!mergedSchema) {
    mergedSchema = await incrementalMergeSchemas(localSchema, 1, {
      ENABLE_COMMERCE_STITCHING: true,
      ENABLE_CONSIGNMENTS_STITCHING: true,
    })
  }
  return graphql(mergedSchema, query, null, context).then((result) => {
    if (result.errors) {
      const error = result.errors[0]
      throw error.originalError || error
    } else {
      return result.data
    }
  })
}
