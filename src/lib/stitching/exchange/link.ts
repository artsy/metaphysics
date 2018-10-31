import { setContext } from "apollo-link-context"
import { createHttpLink } from "apollo-link-http"
import config from "config"
import { headers as requestIDHeaders } from "lib/requestIDs"
import fetch from "node-fetch"
import urljoin from "url-join"

import { middlewareLink } from "../lib/middlewareLink"
import { responseLoggerLink } from "../logLinkMiddleware"

const { EXCHANGE_API_BASE } = config

export const createExchangeLink = () => {
  const httpLink = createHttpLink({
    fetch,
    uri: urljoin(EXCHANGE_API_BASE, "graphql"),
  })

  const authMiddleware = setContext((_request, context) => {
    const locals = context.graphqlContext && context.graphqlContext.res.locals
    const tokenLoader = locals && locals.dataLoaders.exchangeTokenLoader
    const headers = { ...(locals && requestIDHeaders(locals.requestIDs)) }
    // If a token loader exists for Exchange (i.e. this is an authenticated request), use that token to make
    // authenticated requests to Exchange.
    if (tokenLoader) {
      return tokenLoader().then(({ token }) => {
        return {
          headers: Object.assign(headers, { Authorization: `Bearer ${token}` }),
        }
      })
    }
    // Exchange uses no authentication for now
    return { headers }
  })

  const analyticsMiddleware = setContext((_request, context) => {
    const locals = context.graphqlContext && context.graphqlContext.res.locals
    if (!locals) return context.graphqlContext
    return {
      ...context.graphqlContext,
      headers: {
        ...context.graphqlContext.headers,
        "User-Agent": locals.userAgent
          ? locals.userAgent + "; Metaphysics"
          : "Metaphysics",
      },
    }
  })

  return middlewareLink
    .concat(analyticsMiddleware)
    .concat(authMiddleware)
    .concat(responseLoggerLink("Exchange"))
    .concat(httpLink)
}
