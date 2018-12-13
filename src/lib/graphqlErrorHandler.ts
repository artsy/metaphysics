import raven from "raven"
import { error as log } from "lib/loggers"
import { GraphQLTimeoutError } from "lib/graphqlTimeoutMiddleware"
import { Request } from "../../node_modules/@types/express"
import config from "config"
import { GraphQLError } from "graphql/error/GraphQLError"
import { HTTPError } from "./HTTPError"

const blacklistHttpStatuses = [401, 403, 404]

// This is an error class defined in https://github.com/apollographql/graphql-tools/blob/3f87d907af2ac97a32b5ab375bb97198ebfe9e2c/src/stitching/errors.ts#L87-L93
declare class CombinedError extends Error {
  public errors: ReadonlyArray<GraphQLError>
}

const isCombinedError = (
  error: Error | CombinedError
): error is CombinedError => error.hasOwnProperty("errors")

interface QueryContext {
  req: Request
  variables: { [name: string]: any } | null | undefined
  query: string
}

export const shouldReportParentError = (
  error: null | undefined | Error | HTTPError
) => {
  if (error) {
    if (error instanceof HTTPError) {
      return (
        error.statusCode < 500 &&
        !blacklistHttpStatuses.includes(error.statusCode)
      )
    }
    if (error instanceof GraphQLTimeoutError) {
      return false
    }
  }
  return true
}

const reportErrorToSentry = (
  error: GraphQLError,
  { req, variables, query }: QueryContext
) => {
  const baseURL = req.baseUrl
  // TODO: change the href to not include variables when `variables` is null or undefined.
  const encodedVars = encodeURIComponent(JSON.stringify(variables))
  const encodedQuery = encodeURIComponent(query)
  const href = `${baseURL}/graphiql?variables=${encodedVars}&query=${encodedQuery}`

  raven.captureException(error.originalError || error, {
    tags: { graphql: "exec_error" },
    extra: {
      source: (error.source && error.source.body) || query,
      positions: error.positions,
      path: error.path,
      variables,
      href,
    },
    ...raven.parsers.parseRequest(req),
  })
}

export const graphqlErrorHandler = (
  enableSentry: boolean,
  queryContext: QueryContext
) => {
  return (error: GraphQLError) => {
    if (enableSentry) {
      const originalTopLevelError = error.originalError as
        | null
        | undefined
        | Error
        | CombinedError

      if (originalTopLevelError) {
        if (isCombinedError(originalTopLevelError)) {
          originalTopLevelError.errors.forEach(error => {
            if (shouldReportParentError(error.originalError)) {
              reportErrorToSentry(error, queryContext)
            }
          })
        } else {
          if (shouldReportParentError(originalTopLevelError)) {
            reportErrorToSentry(error, queryContext)
          }
        }
      } else {
        reportErrorToSentry(error, queryContext)
      }
    } else {
      const path =
        error.path && error.path.length > 0
          ? ` (${JSON.stringify(error.path)})`
          : ""
      log(`${error.message}${path}`)
    }
    return {
      message: error.message,
      locations: error.locations,
      // Question: Should this be a flag on Sentry enabled, or on being in the production env?
      path: config.PRODUCTION_ENV ? null : error.path,
      stack: config.PRODUCTION_ENV ? null : error.stack,
    }
  }
}
