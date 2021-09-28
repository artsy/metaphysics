import { ExecutorMiddleware } from "lib/stitching2/lib/createRemoteExecutor"
import extensionsLogger from "lib/loaders/api/extensionsLogger"
import config from "config"

const { ENABLE_REQUEST_LOGGING, LOG_HTTP_LINKS } = config

const shouldLogLinkTraffic =
  LOG_HTTP_LINKS === "true" && typeof jest === "undefined"

const enableRequestLogging = ENABLE_REQUEST_LOGGING === "true"

export const responseLoggerMiddleware = (name: string): ExecutorMiddleware => {
  return (operation) => {
    if (shouldLogLinkTraffic) {
      console.log(`>\n> Made query to ${name}:`)
      console.log(">\n" + operation.text)
      console.log(`> Got Response:`)
      console.log("> " + JSON.stringify(operation.result))
    }
    if (enableRequestLogging) {
      const requestID = operation.context?.requestIDs.requestID
      if (requestID) {
        extensionsLogger(requestID, "stitching", name.toLowerCase(), {
          query: operation.text,
          vars: operation.variables,
        })
      }
    }
    return operation
  }
}
