import { createHttpLink } from "apollo-link-http"
import config from "config"
import fetch from "node-fetch"
import urljoin from "url-join"
import { createRemoteExecutor } from "../lib/createRemoteExecutor"

import { middlewareLink } from "../lib/middlewareLink"
import {
  responseLoggerLink,
  responseLoggerMiddleware,
} from "../logLinkMiddleware"

const { KAWS_API_BASE } = config

/** @deprecated Prefer using the new style of schema stitching */
export const createKawsLink = () => {
  const httpLink = createHttpLink({
    fetch,
    uri: urljoin(KAWS_API_BASE, "graphql"),
  })

  return middlewareLink.concat(responseLoggerLink("Kaws")).concat(httpLink)
}

export const createKawsExecutor = () => {
  return createRemoteExecutor(urljoin(KAWS_API_BASE, "graphql"), {
    middleware: [responseLoggerMiddleware("Kaws")],
  })
}
