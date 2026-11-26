import urljoin from "url-join"
import { assign, omit } from "lodash"
import fetch from "./fetch"
import config from "config"
import { headers as requestIDHeaders } from "../requestIDs"

const { EXCHANGE_API_BASE } = config

export default (path, accessToken, fetchOptions: any = {}) => {
  const headers = {}
  if (accessToken) {
    assign(headers, { Authorization: `Bearer ${accessToken}` })
  }

  // Only loaders that opt in forward the request ID, client IP and session ID,
  // as the GraphQL link does (Exchange records the IP and session ID on new
  // orders). Every other loader sends the same headers as before.
  if (fetchOptions.forwardRequestIDs) {
    if (fetchOptions.requestIDs) {
      assign(headers, requestIDHeaders(fetchOptions.requestIDs))
    }
    return fetch(
      urljoin(EXCHANGE_API_BASE, path),
      assign({}, omit(fetchOptions, "forwardRequestIDs", "requestIDs"), {
        headers,
      })
    )
  }

  return fetch(
    urljoin(EXCHANGE_API_BASE, path),
    assign({}, fetchOptions, { headers })
  )
}
