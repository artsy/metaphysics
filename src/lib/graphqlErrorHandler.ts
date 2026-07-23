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

// Yoga picks the response's HTTP status in `getResponseInitByRespectingErrors`
// (`graphql-yoga/cjs/error.js`). It reads `extensions.http.status` from each
// error, but only when the error is a real `GraphQLError` instance. An error
// that fails `isOriginalGraphQLError` (not a `GraphQLError`, or wrapping a
// non-`GraphQLError` original) forces a 500 whenever no `data` was produced,
// which is what happens with bad variables and parse errors. So this
// formatter must:
//   1. return the same `GraphQLError` instance, never a plain object copy,
//      so Yoga's classification keeps working, and
//   2. write the resolved status to `extensions.http.status`, the key Yoga
//      reads.
//
// `extensions.httpStatusCodes` stays for consumers of the raw GraphQL
// response; Yoga does not read it.
export const formattedGraphQLError = (
  topLevelError: GraphQLError,
  flattenedErrors?: ReadonlyArray<GraphQLError>
): GraphQLError => {
  const extensions: { [key: string]: any } = {
    ...topLevelError.extensions,
  }

  if (config.PRODUCTION_ENV) {
    // Extensions now flow through to the client, and an error from a
    // stitched backend can arrive with debug details already in place.
    // Strip the conventional debug keys so production clients never see
    // them.
    delete extensions.stack
    delete extensions.exception
  } else {
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

    // Only a client error (4xx) becomes the response status. An upstream
    // 5xx is left alone: when other fields resolved, Yoga returns 200 with
    // the error under `errors` (partial failure), and it still returns 500
    // when an unexpected error occurs before any `data` exists. Forcing
    // every upstream 5xx onto the whole response would turn partial
    // failures into hard 500s, the very problem this fixes. Non-error codes
    // (2xx/3xx, which `statusCodeForError` can produce via its regex and
    // stitched-response paths) must not become the response status either.
    const clientErrorStatus = httpStatusCodes.find(
      (code) => code >= 400 && code < 500
    )
    if (clientErrorStatus) {
      extensions.http = { status: clientErrorStatus }
    }
  }

  // `extensions` is readonly only in TypeScript's typings; the underlying
  // property is plain and writable. Assign a fresh object rather than
  // mutating in place: when a `GraphQLError` is constructed without its own
  // extensions, graphql-js reuses `originalError.extensions` by reference,
  // and that shared (possibly frozen) object must stay untouched.
  ;(topLevelError as any).extensions = extensions

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
