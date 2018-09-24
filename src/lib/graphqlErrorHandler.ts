import raven from "raven"
import { assign } from "lodash"
import { error as log } from "lib/loggers"
import { GraphQLTimeoutError } from "lib/graphqlTimeoutMiddleware"
import { Request } from "../../node_modules/@types/express"
import config from "config"

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

export const graphqlErrorHandler = (
  req: Request,
  { enableSentry, variables, query }
) => {
  return error => {
    if (enableSentry && shouldReportError(error.originalError)) {
      // Generate a clickable link to re-create this error
      const baseURL = req.baseUrl
      const encodedVars = encodeURIComponent(JSON.stringify(variables))
      const encodedQuery = encodeURIComponent(query)
      const href = `${baseURL}/graphiql?variables=${encodedVars}&query=${encodedQuery}`

      raven.captureException(
        error,
        assign(
          {},
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
      path: config.PRODUCTION_ENV ? null : error.path,
      stack: config.PRODUCTION_ENV ? null : error.stack,
    }
  }
}
