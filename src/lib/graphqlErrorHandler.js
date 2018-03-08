import raven from "raven"
import { assign } from "lodash"

export default function graphqlErrorHandler(
  req,
  { isProduction, enableSentry }
) {
  return error => {
    if (enableSentry) {
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
    return {
      message: error.message,
      locations: error.locations,
      stack: isProduction ? null : error.stack,
    }
  }
}
