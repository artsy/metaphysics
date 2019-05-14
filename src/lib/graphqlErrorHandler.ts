import raven from "raven"
import { error as log } from "lib/loggers"
import { GraphQLTimeoutError } from "lib/graphqlTimeoutMiddleware"
import { Request } from "../../node_modules/@types/express"
import config from "config"
import { GraphQLError, GraphQLFormattedError } from "graphql/error"
import { HTTPError } from "./HTTPError"

const blacklistHttpStatuses = [401, 403, 404]

// This is an error class defined in https://github.com/apollographql/graphql-tools/blob/3f87d907af2ac97a32b5ab375bb97198ebfe9e2c/src/stitching/errors.ts#L87-L93
declare class CombinedError extends Error {
  public errors: ReadonlyArray<GraphQLError>
}

const isCombinedError = (
  error?: Error | CombinedError | null
): error is CombinedError => !!error && error.hasOwnProperty("errors")

const flattenErrors = (error: GraphQLError) => {
  const originalTopLevelError = error.originalError as
    | null
    | undefined
    | Error
    | CombinedError
  return isCombinedError(originalTopLevelError)
    ? originalTopLevelError.errors
    : [error]
}

interface QueryContext {
  req: Request
  variables: { [name: string]: any } | null | undefined
  query: string
}

export const shouldReportError = (
  error: null | undefined | Error | HTTPError | GraphQLError
) => {
  if (error) {
    if (error instanceof GraphQLError) {
      if (error.message.startsWith("Syntax Error")) {
        return false
      } else {
        return shouldReportError(error.originalError)
      }
    }
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

type WriteablePartial<T> = { -readonly [P in keyof T]+?: T[P] }

export const formattedGraphQLError = (
  topLevelError: GraphQLError,
  flattenedErrors?: ReadonlyArray<GraphQLError>
) => {
  const result: WriteablePartial<GraphQLFormattedError> = {
    message: topLevelError.message,
  }
  if (topLevelError.locations) {
    result.locations = topLevelError.locations
  }
  // Question: Should this be a flag on Sentry enabled, or on being in the production env?
  if (config.PRODUCTION_ENV) {
    result.path = topLevelError.path
    result.stack = topLevelError.stack
  }

  const httpStatusCodes: number[] = []
  ;(flattenedErrors || flattenErrors(topLevelError)).forEach(
    e =>
      e.originalError instanceof HTTPError &&
      httpStatusCodes.push(e.originalError.statusCode)
  )
  if (httpStatusCodes.length > 0) {
    result.extensions = { httpStatusCodes }
  }

  return result
}

export const graphqlErrorHandler = (
  enableSentry: boolean,
  queryContext: QueryContext
) => {
  return (topLevelError: GraphQLError) => {
    const flattenedErrors = flattenErrors(topLevelError)
    if (enableSentry) {
      flattenedErrors.forEach(e => {
        if (shouldReportError(e)) {
          reportErrorToSentry(e, queryContext)
        }
      })
    } else {
      const path =
        topLevelError.path && topLevelError.path.length > 0
          ? ` (${JSON.stringify(topLevelError.path)})`
          : ""
      log(`${topLevelError.message}${path}`)
    }
    return formattedGraphQLError(topLevelError, flattenedErrors)
  }
}
