import type { ExecutionRequest, Executor } from "@graphql-tools/utils"
import { DocumentNode, print, visit } from "graphql"
import config from "../../config"
import extensionsLogger from "lib/loaders/api/extensionsLogger"
import { ResolverContext } from "types/graphql"

const shouldLogLinkTraffic =
  !!process.env.LOG_HTTP_LINKS && typeof jest === "undefined"
const { ENABLE_REQUEST_LOGGING } = config
const enableRequestLogging = ENABLE_REQUEST_LOGGING === "true"

// Directives declared locally by metaphysics that have no meaning on remote
// services. `delegateToSchema` copies directives from the user's field nodes
// onto the delegated root field; without stripping, the remote rejects them.
const METAPHYSICS_ONLY_DIRECTIVES = new Set([
  "principalField",
  "optionalField",
  "cacheable",
])

const stripLocalDirectives = (document: DocumentNode): DocumentNode =>
  visit(document, {
    Directive(node) {
      if (METAPHYSICS_ONLY_DIRECTIVES.has(node.name.value)) {
        return null
      }
      return undefined
    },
  })

export const getResolverContext = (
  request: ExecutionRequest | undefined
): ResolverContext | undefined =>
  (request?.context as unknown) as ResolverContext | undefined

export function withResponseLogging(
  name: string,
  executor: Executor
): Executor {
  return async (request) => {
    request = { ...request, document: stripLocalDirectives(request.document) }
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
