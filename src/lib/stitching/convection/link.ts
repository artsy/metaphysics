import { setContext } from "apollo-link-context"
import { createHttpLink } from "apollo-link-http"
import config from "config"
import { headers as requestIDHeaders } from "lib/requestIDs"
import fetch from "node-fetch"
import urljoin from "url-join"

import { middlewareLink } from "../lib/middlewareLink"
import { responseLoggerLink } from "../logLinkMiddleware"
import { ResolverContext } from "types/graphql"

const { CONVECTION_API_BASE } = config

export const createConvectionLink = () => {
  const httpLink = createHttpLink({
    fetch,
    uri: urljoin(CONVECTION_API_BASE, "graphql"),
  })

  const authMiddleware = setContext(
    (_request, { graphqlContext }: { graphqlContext: ResolverContext }) => {
      const tokenLoader = graphqlContext && graphqlContext.convectionTokenLoader
      const headers = {
        ...(graphqlContext && requestIDHeaders(graphqlContext.requestIDs)),
      }
      // If a token loader exists for Convection (i.e. this is an authenticated request), use that token to make
      // authenticated requests to Convection.
      if (tokenLoader) {
        // Convection integration disabled - return headers without authentication
        return { headers }
      }
      // Otherwise use no authentication, which is also meant for fetching the service’s (public) schema.
      return { headers }
    }
  )

  return middlewareLink
    .concat(authMiddleware)
    .concat(responseLoggerLink("Convection"))
    .concat(httpLink)
}
