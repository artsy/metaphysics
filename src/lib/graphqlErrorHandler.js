import raven from "raven"
import { assign } from "lodash"
import { error as log } from "lib/loggers"
import { GraphQLTimeoutError } from "lib/graphqlTimeoutMiddleware"

const blacklistHttpStatuses = [401, 403, 404]

export const shouldReportError = originalError => {
  if (originalError) {
    if (originalError.statusCode) {
      return (
        originalError.statusCode < 500 &&
        !blacklistHttpStatuses.includes(originalError.statusCode)
      )
    }
    if (originalError instanceof GraphQLTimeoutError) {
      return false
    }
  }
  return true
}

const isStaging = process.env.GRAVITY_API_URL.includes("staging")
const subdomain = isStaging ? "metaphysics-staging" : "metaphysics-production"

export default function graphqlErrorHandler(
  req,
  { isProduction, enableSentry, variables }
) {
  return error => {
    if (enableSentry && shouldReportError(error.originalError)) {
      // Generate a clickable link to re-create this error
      const baseURL = `https://${subdomain}.artsy.net`
      const encodedVars = encodeURIComponent(JSON.stringify(variables))
      const encodedQuery = encodeURIComponent(error.source && error.source.body)
      const href = `${baseURL}/graphiql?variables=${encodedVars}&query=${
        encodedQuery
      }`

      raven.captureException(
        error,
        assign(
          {},
          {
            tags: { graphql: "exec_error" },
            extra: {
              source: error.source && error.source.body,
              positions: error.positions,
              path: error.path,
              variables,
              href,
            },
          },
          raven.parsers.parseRequest(req)
        )
      )
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
      path: isProduction ? null : error.path,
      stack: isProduction ? null : error.stack,
    }
  }
}
