import { ApolloLink } from "apollo-link"
import { print } from "graphql/language"
import config from "../../config"
import extensionsLogger from "lib/loaders/api/extensionsLogger"
import { ResolverContext } from "types/graphql"

const shouldLogLinkTraffic =
  !!process.env.LOG_HTTP_LINKS && typeof jest === "undefined"
const { ENABLE_REQUEST_LOGGING } = config
const enableRequestLogging = ENABLE_REQUEST_LOGGING === "true"

/**
 * This acts more like a post-middleware logger, by running the operation
 * waiting until it's done, and then logging out the response.
 *
 * To use, set `LOG_HTTP_LINKS=true` in .env file.
 */
export const responseLoggerLink = (name: string) => {
  return new ApolloLink((operation, forward) => {
    if (!(forward && operation)) {
      return null
    }

    return forward(operation).map((response) => {
      // Log to CLI
      if (shouldLogLinkTraffic) {
        console.log(`>\n> Made query to ${name}:`)
        console.log(">\n" + print(operation.query))
        console.log(`> Got Response:`)
        console.log("> " + JSON.stringify(response))
      }
      // Log the query/vars sent to the stitched API in the extensions
      if (enableRequestLogging) {
        const requestID = (operation.getContext()
          .graphqlContext as ResolverContext).requestIDs.requestID
        if (requestID) {
          extensionsLogger(requestID, "stitching", name.toLowerCase(), {
            query: print(operation.query),
            vars: operation.variables,
          })
        }
      }
      return response
    })
  })
}
