import { get } from "lodash"
import { error as log } from "lib/loggers"
import { GraphQLTimeoutError } from "lib/graphqlTimeoutMiddleware"
import { Request } from "../../node_modules/@types/express"
import config from "config"
import { GraphQLError } from "graphql/error"
import { HTTPError } from "./HTTPError"
import * as Sentry from "@sentry/node"

const allowlistHttpStatuses = [401, 403, 404]

// This is an error class defined in https://github.com/apollographql/graphql-tools/blob/3f87d907af2ac97a32b5ab375bb97198ebfe9e2c/src/stitching/errors.ts#L87-L93
declare class CombinedError extends Error {
  public errors: ReadonlyArray<GraphQLError>
}

const isCombinedError = (
  error?: Error | CombinedError | null
): error is CombinedError =>
  !!error && Object.prototype.hasOwnProperty.call(error, "errors")

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

// An error can be wrapped in several nested `GraphQLError`s before it reaches
// us: `graphql-middleware` (e.g. our @timeout middleware) wraps every resolver,
// and graphql 16 re-locates the error at each execution layer it crosses,
// nesting `originalError` one level deeper each time. (This reproduces even for
// a plain local resolver, so it is not specific to stitching.) Walk the chain
// to the underlying error instead of assuming it's exactly one level down.
export const deepestOriginalError = (
  e?: Error | GraphQLError | null
): Error | GraphQLError | null | undefined => {
  let current = e
  while (current && (current as GraphQLError).originalError) {
    current = (current as GraphQLError).originalError as Error | GraphQLError
  }
  return current
}

export const statusCodeForError = (e) => {
  // Check for server-side errors during stitching downstream.
  // `e.originalError` is of `ServerError` type.
  // https://github.com/apollographql/apollo-link/blob/480df382cf7db486ae76c56ac2522134d77e36fa/packages/apollo-link-http-common/src/index.ts#L15
  //
  // TODO: The below doesn't seem to be set for errors from stitched services.
  const stitchedStatusCode = get(e, "originalError.response.status")

  // TODO: Look into what step/layer is causing an error object from stitching
  // to be coerced into a string.
  const originalMessage = e.originalError && e.originalError.message
  const matchedStatus =
    originalMessage && originalMessage.match(/extensions: { code: (\d+)/)
  const matchedCode: string | undefined = (matchedStatus || []).slice(-1)[0]
  const alternateStitchedStatusCode = matchedCode && parseInt(matchedCode)

  const deepestError = deepestOriginalError(e)

  return (
    stitchedStatusCode ||
    (deepestError instanceof HTTPError && deepestError.statusCode) ||
    alternateStitchedStatusCode
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
        !allowlistHttpStatuses.includes(error.statusCode)
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

  Sentry.captureException(
    deepestOriginalError(error) || error,
    Sentry.Handlers.parseRequest(
      {
        tags: { graphql: "exec_error" },
        extra: {
          source: (error.source && error.source.body) || query,
          positions: error.positions,
          path: error.path,
          variables,
          href,
        },
      },
      req
    )
  )
}

export type GraphQLErrorHandler = (topLevelError: GraphQLError) => GraphQLError

// Must return the same `GraphQLError` instance (not a plain object copy) so
// Yoga's expected/unexpected error classification keeps working, and must
// write the status to `extensions.http.status`, the key Yoga reads (not
// `extensions.httpStatusCodes`, kept below for existing consumers).
export const formattedGraphQLError = (
  topLevelError: GraphQLError,
  flattenedErrors?: ReadonlyArray<GraphQLError>
): GraphQLError => {
  const extensions: { [key: string]: any } = {
    ...(topLevelError.extensions ?? {}),
  }

  const includeStackTrace = !config.PRODUCTION_ENV
  if (includeStackTrace) {
    extensions.stack = topLevelError.stack?.split("\n")
  }

  const httpStatusCodes: number[] = []
  ;(flattenedErrors || flattenErrors(topLevelError)).forEach((e) => {
    const statusCode = statusCodeForError(e)
    if (statusCode) {
      httpStatusCodes.push(statusCode)
    }
  })
  if (httpStatusCodes.length > 0) {
    extensions.httpStatusCodes = httpStatusCodes

    // A plain 5xx from an upstream hiccup is deliberately left off the
    // response status: Yoga already returns 200 + errors when other data
    // resolved, and forcing every upstream 500 onto the response would
    // recreate the SLO problem this fix is for.
    const primaryStatusCode = httpStatusCodes.find((code) => code < 500)
    if (primaryStatusCode) {
      extensions.http = { status: primaryStatusCode }
    }
  }

  // `extensions` is typed `readonly`, so mutate in place rather than
  // reassign — this keeps the same `GraphQLError` instance.
  if (Object.keys(extensions).length > 0) {
    Object.assign(topLevelError.extensions, extensions)
  }

  return topLevelError
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
