import { setContext } from "apollo-link-context"
import { createHttpLink } from "apollo-link-http"
import config from "config"
import { headers as requestIDHeaders } from "lib/requestIDs"
import fetch from "node-fetch"
import urljoin from "url-join"

import { middlewareLink } from "../lib/middlewareLink"
import { responseLoggerLink } from "../logLinkMiddleware"
import { ResolverContext } from "types/graphql"

const { EXCHANGE_API_BASE } = config

export const createExchangeLink = () => {
  const httpLink = createHttpLink({
    fetch,
    uri: urljoin(EXCHANGE_API_BASE, "graphql"),
  })

  const authMiddleware = setContext(
    (_request, { graphqlContext }: { graphqlContext: ResolverContext }) => {
      const tokenLoader = graphqlContext && graphqlContext.exchangeTokenLoader
      const headers = {
        ...(graphqlContext && requestIDHeaders(graphqlContext.requestIDs)),
      }
      // If a token loader exists for Exchange (i.e. this is an authenticated request), use that token to make
      // authenticated requests to Exchange.
      if (tokenLoader) {
        return tokenLoader().then(({ token }) => {
          return {
            headers: Object.assign(headers, {
              Authorization: `Bearer ${token}`,
            }),
          }
        })
      }
      // Exchange uses no authentication for now
      return { headers }
    }
  )

  const analyticsMiddleware = setContext(
    (
      _request,
      context: {
        headers: Record<string, unknown>
        graphqlContext: ResolverContext
      }
    ) => {
      if (!context.graphqlContext) return context
      const userAgent = context.graphqlContext.userAgent
      const headers = {
        ...context.headers,
        "User-Agent": userAgent ? userAgent + "; Metaphysics" : "Metaphysics",
      }
      return { headers }
    }
  )

  return middlewareLink
    .concat(authMiddleware)
    .concat(analyticsMiddleware)
    .concat(responseLoggerLink("Exchange"))
    .concat(httpLink)
}
