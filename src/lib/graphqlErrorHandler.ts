import raven from "raven"
import { get } from "lodash"
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

export const flattenErrors = (error: GraphQLError) => {
  const originalTopLevelError = error.originalError as
    | null
    | undefined
    | Error
    | CombinedError
  return isCombinedError(originalTopLevelError)
    ? originalTopLevelError.errors
    : [error]
}

export const statusCodeForError = (e) => {
  // Check for server-side errors during stitching downstream.
  // `e.originalError` is of `ServerError` type.
  // https://github.com/apollographql/apollo-link/blob/480df382cf7db486ae76c56ac2522134d77e36fa/packages/apollo-link-http-common/src/index.ts#L15
  const stitchedStatusCode = get(e, "originalError.response.status")
  return (
    stitchedStatusCode ||
    (e.originalError instanceof HTTPError && e.originalError.statusCode)
  )
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

export type GraphQLErrorHandler = (
  topLevelError: GraphQLError
) => WriteablePartial<GraphQLFormattedError>

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

  if (topLevelError.path) {
    result.path = topLevelError.path
  }

  const includeStackTrace = !config.PRODUCTION_ENV
  if (includeStackTrace) {
    // TODO: Is the stack still being included in the response or should this
    //       move to extensions?
    ;(result as any).stack = topLevelError.stack
  }

  const httpStatusCodes: number[] = []
  ;(flattenedErrors || flattenErrors(topLevelError)).forEach((e) => {
    // Check for server-side errors during stitching downstream.
    // `e.originalError` is of `ServerError` type.
    // https://github.com/apollographql/apollo-link/blob/480df382cf7db486ae76c56ac2522134d77e36fa/packages/apollo-link-http-common/src/index.ts#L15
    const statusCode = statusCodeForError(e)
    if (statusCode) {
      httpStatusCodes.push(statusCode)
    }
  })
  if (httpStatusCodes.length > 0) {
    result.extensions = { httpStatusCodes }
  }

  return result
}

export const graphqlErrorHandler = (
  enableSentry: boolean,
  queryContext: QueryContext
): GraphQLErrorHandler => {
  return (topLevelError: GraphQLError) => {
    const flattenedErrors = flattenErrors(topLevelError)
    if (enableSentry) {
      flattenedErrors.forEach((e) => {
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
