import { setContext } from "apollo-link-context"
import { createHttpLink } from "apollo-link-http"
import config from "config"
import { headers as requestIDHeaders } from "lib/requestIDs"
import fetch from "node-fetch"
import urljoin from "url-join"

import { middlewareLink } from "../lib/middlewareLink"
import { responseLoggerLink } from "../logLinkMiddleware"

const { LEWITT_API_BASE } = config

export const createLewittLink = () => {
  const httpLink = createHttpLink({
    fetch,
    uri: urljoin(LEWITT_API_BASE, "graphql"),
  })

  const authMiddleware = setContext((_request, context) => {
    const locals = context.graphqlContext && context.graphqlContext.res.locals
    const headers = { ...(locals && requestIDHeaders(locals.requestIDs)) }
    // Lewitt uses no authentication for now
    return { headers }
  })

  return middlewareLink
    .concat(authMiddleware)
    .concat(responseLoggerLink("Lewitt"))
    .concat(httpLink)
}
