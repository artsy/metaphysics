import raven from "raven"
import { assign } from "lodash"

const blacklistHttpStatuses = [401, 403, 404]

export const shouldLogError = originalError => {
  if (originalError && originalError.statusCode) {
    return originalError.statusCode < 500 && !blacklistHttpStatuses.includes(originalError.statusCode)
  }
  return true
}

export default function graphqlErrorHandler(req, { isProduction, enableSentry }) {
  return error => {
    if (enableSentry) {
      if (shouldLogError(error.originalError)) {
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
              },
            },
            raven.parsers.parseRequest(req)
          )
        )
      }
    }
    return {
      message: error.message,
      locations: error.locations,
      stack: isProduction ? null : error.stack,
    }
  }
}
