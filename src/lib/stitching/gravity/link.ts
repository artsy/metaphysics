import { setContext } from "apollo-link-context"
import { createHttpLink } from "apollo-link-http"
import config from "config"
import { headers as requestIDHeaders } from "lib/requestIDs"
import fetch from "node-fetch"
import urljoin from "url-join"

import { middlewareLink } from "../lib/middlewareLink"
import { responseLoggerLink } from "../logLinkMiddleware"
import { ResolverContext } from "types/graphql"

const { GRAVITY_GRAPHQL_ENDPOINT } = config

export const createGravityLink = () => {
  const httpLink = createHttpLink({
    fetch,
    uri: urljoin(GRAVITY_GRAPHQL_ENDPOINT, "graphql"),
  })

  const authMiddleware = setContext(
    (_request, { graphqlContext }: { graphqlContext: ResolverContext }) => {
      const headers = {
        ...(graphqlContext && requestIDHeaders(graphqlContext.requestIDs)),
      }
      const xappToken = graphqlContext.appToken || config.GRAVITY_XAPP_TOKEN
      Object.assign(headers, { "X-XAPP-TOKEN": xappToken })
      if (graphqlContext.accessToken) {
        Object.assign(headers, { "X-ACCESS-TOKEN": graphqlContext.accessToken })
      }
      return { headers }
    }
  )

  return middlewareLink
    .concat(authMiddleware)
    .concat(responseLoggerLink("GravQL"))
    .concat(httpLink)
}
