import { setContext } from "apollo-link-context"
import { createHttpLink } from "apollo-link-http"
import config from "config"
import { headers as requestIDHeaders } from "lib/requestIDs"
import fetch from "node-fetch"
import urljoin from "url-join"

import { middlewareLink } from "../lib/middlewareLink"
import { responseLoggerLink } from "../logLinkMiddleware"

const { GRAVITY_GRAPHQL_ENDPOINT } = config

export const createGravityLink = () => {
  const httpLink = createHttpLink({
    fetch,
    uri: urljoin(GRAVITY_GRAPHQL_ENDPOINT, "graphql"),
  })

  const authMiddleware = setContext((_request, context) => {
    const locals = context.graphqlContext && context.graphqlContext.res.locals
    const headers = { ...(locals && requestIDHeaders(locals.requestIDs)) }
    Object.assign(headers, { "X-XAPP-TOKEN": config.GRAVITY_XAPP_TOKEN })
    if (locals.accessToken) {
      Object.assign(headers, { "X-ACCESS-TOKEN": locals.accessToken })
    }
    return { headers }
  })

  return middlewareLink
    .concat(authMiddleware)
    .concat(responseLoggerLink("GravQL"))
    .concat(httpLink)
}
