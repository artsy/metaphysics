import type { ExecutionRequest, Executor } from "@graphql-tools/utils"
import { print } from "graphql/language"
import config from "../../config"
import extensionsLogger from "lib/loaders/api/extensionsLogger"
import { ResolverContext } from "types/graphql"

const shouldLogLinkTraffic =
  !!process.env.LOG_HTTP_LINKS && typeof jest === "undefined"
const { ENABLE_REQUEST_LOGGING } = config
const enableRequestLogging = ENABLE_REQUEST_LOGGING === "true"

export const getResolverContext = (
  request: ExecutionRequest | undefined
): ResolverContext | undefined =>
  (request?.context as unknown) as ResolverContext | undefined

export function withResponseLogging(
  name: string,
  executor: Executor
): Executor {
  return async (request) => {
    const result = await executor(request)

    if (shouldLogLinkTraffic) {
      console.log(`>\n> Made query to ${name}:`)
      console.log(">\n" + print(request.document))
      console.log(`> Got Response:`)
      console.log("> " + JSON.stringify(result))
    }

    if (enableRequestLogging) {
      const requestID = getResolverContext(request)?.requestIDs?.requestID
      if (requestID) {
        extensionsLogger(requestID, "stitching", name.toLowerCase(), {
          query: print(request.document),
          vars: request.variables,
        })
      }
    }

    return result
  }
}
