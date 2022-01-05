import { createHttpLink } from "apollo-link-http"
import config from "config"
import fetch from "node-fetch"
import urljoin from "url-join"

import { middlewareLink } from "../lib/middlewareLink"
import { responseLoggerLink } from "../logLinkMiddleware"

const { POSITRON_API_BASE } = config

export const createPositronLink = () => {
  const httpLink = createHttpLink({
    fetch,
    uri: urljoin(POSITRON_API_BASE, "graphql"),
  })

  return middlewareLink.concat(responseLoggerLink("Positron")).concat(httpLink)
}
