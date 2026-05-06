import { createHttpLink } from "apollo-link-http"
import config from "config"
import fetch from "node-fetch"
import urljoin from "url-join"

import { middlewareLink } from "../lib/middlewareLink"
import { responseLoggerLink } from "../logLinkMiddleware"
import { setContext } from "apollo-link-context"
import { ResolverContext } from "types/graphql"
import { headers as requestIDHeaders } from "lib/requestIDs"
import { causalityJwt } from "schema/v2/system/causality_jwt"

const { CAUSALITY_API_BASE } = config

export const createCausalityLink = () => {
  const httpLink = createHttpLink({
    fetch,
    uri: urljoin(CAUSALITY_API_BASE, "graphql"),
  })

  const authMiddleware = setContext(
    (_request, { graphqlContext }: { graphqlContext: ResolverContext }) => {
      const meLoader = graphqlContext && graphqlContext.meLoader
      const headers = {
        ...(graphqlContext && requestIDHeaders(graphqlContext.requestIDs)),
      }
      // If a user is present get their ID (via meLoader) and make a causality Jwt with it
      if (meLoader) {
        return meLoader().then(({ id }) => {
          const token = causalityJwt({
            userId: id,
            role: "observer",
            saleId: null,
            bidderId: null,
          })
          return {
            headers: Object.assign(headers, {
              Authorization: `Bearer ${token}`,
            }),
          }
        })
      }
      return { headers }
    }
  )

  return middlewareLink
    .concat(responseLoggerLink("Causality"))
    .concat(authMiddleware)
    .concat(httpLink)
}
