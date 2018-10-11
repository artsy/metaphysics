import { createHttpLink } from "apollo-link-http"
import config from "config"
import fetch from "node-fetch"
import urljoin from "url-join"

import { middlewareLink } from "../lib/middlewareLink"
import { responseLoggerLink } from "../logLinkMiddleware"

const { KAWS_API_BASE } = config

export const createKawsLink = () => {
  const httpLink = createHttpLink({
    fetch,
    uri: urljoin(KAWS_API_BASE, "graphql"),
  })

  return middlewareLink.concat(responseLoggerLink("Kaws")).concat(httpLink)
}
