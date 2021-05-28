import { setContext } from "apollo-link-context"
import { createHttpLink } from "apollo-link-http"
import config from "config"
import { headers as requestIDHeaders } from "lib/requestIDs"
import fetch from "node-fetch"
import urljoin from "url-join"

import { middlewareLink } from "../lib/middlewareLink"
import { responseLoggerLink } from "../logLinkMiddleware"
import { ResolverContext } from "types/graphql"

const { DIFFUSION_API_BASE } = config

export const createDiffusionLink = () => {
  const httpLink = createHttpLink({
    fetch,
    uri: urljoin(DIFFUSION_API_BASE, "graphql"),
  })

  const authMiddleware = setContext(
    (_request, { graphqlContext }: { graphqlContext: ResolverContext }) => {
      const tokenLoader = graphqlContext && graphqlContext.diffusionTokenLoader
      const headers = {
        ...(graphqlContext && requestIDHeaders(graphqlContext.requestIDs)),
      }
      if (tokenLoader) {
        return tokenLoader().then(({ token }) => ({
          headers: Object.assign(headers, { Authorization: `Bearer ${token}` }),
        }))
      }
      return { headers }
    }
  )

  return middlewareLink
    .concat(authMiddleware)
    .concat(responseLoggerLink("Diffusion"))
    .concat(httpLink)
}
