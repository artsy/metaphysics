import { ApolloLink } from "apollo-link"
import { print } from "graphql/language"
import config from "../../config"
import extensionsLogger from "lib/loaders/api/extensionsLogger"
import { ResolverContext } from "types/graphql"

const shouldLogLinkTraffic = !!process.env.LOG_HTTP_LINKS
const { ENABLE_REQUEST_LOGGING } = config
const enableRequestLogging = ENABLE_REQUEST_LOGGING === "true"

/**
 * This acts more like a post-middleware logger, by running the operation
 * waiting until it's done, and then logging out the response.
 */
export const responseLoggerLink = (name: string) =>
  new ApolloLink(
    (operation, forward) =>
      // null checks
      (forward &&
        operation &&
        forward(operation).map((response) => {
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
        })) ||
      null // if it didn't include forward/operation
  )
