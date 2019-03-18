import { createHttpLink } from "apollo-link-http"
import config from "config"
import fetch from "node-fetch"
import urljoin from "url-join"

import { middlewareLink } from "../lib/middlewareLink"
import { responseLoggerLink } from "../logLinkMiddleware"

const { VORTEX_API_BASE } = config

export const createVortexLink = () => {
  const httpLink = createHttpLink({
    fetch,
    uri: urljoin(VORTEX_API_BASE, "graphql"),
  })

  return middlewareLink.concat(responseLoggerLink("Vortex")).concat(httpLink)
}
