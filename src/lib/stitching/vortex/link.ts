import { createHttpLink } from "apollo-link-http"
import config from "config"
import fetch from "node-fetch"
import urljoin from "url-join"

import { middlewareLink } from "../lib/middlewareLink"
import { responseLoggerLink } from "../logLinkMiddleware"

import { setContext } from "apollo-link-context"
import { headers as requestIDHeaders } from "lib/requestIDs"
import { ResolverContext } from "types/graphql"
import { tokenIfPropagatable } from "lib/apis/vortex"

const { VORTEX_API_BASE, VORTEX_TOKEN } = config

export const createVortexLink = () => {
  const httpLink = createHttpLink({
    fetch,
    uri: urljoin(VORTEX_API_BASE, "graphql"),
  })

  const authMiddleware = setContext(
    (_request, { graphqlContext }: { graphqlContext: ResolverContext }) => {
      const tokenLoader = graphqlContext && graphqlContext.vortexTokenLoader
      const headers = {
        ...(graphqlContext && requestIDHeaders(graphqlContext.requestIDs)),
      }

      if (tokenLoader && !tokenIfPropagatable(graphqlContext.appToken)) {
        return tokenLoader().then(({ token }) => {
          return {
            headers: Object.assign(headers, {
              Authorization: `Bearer ${token}`,
            }),
          }
        })
      }

      const token = tokenIfPropagatable(graphqlContext.appToken) || VORTEX_TOKEN
      const bearer = `Bearer ${token}`

      return {
        headers: {
          ...headers,
          Authorization: bearer,
        },
      }
    }
  )

  return middlewareLink
    .concat(authMiddleware)
    .concat(responseLoggerLink("Vortex"))
    .concat(httpLink)
}
