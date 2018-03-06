// @ts-check

import urljoin from "url-join"
import { assign, omit } from "lodash"
import fetch from "./fetch"
import config from "config"
import { headers as requestIDHeaders } from "../requestIDs"

const { GRAVITY_API_BASE } = config

export default (path, accessToken, fetchOptions = {}) => {
  const headers = { "X-XAPP-TOKEN": config.GRAVITY_XAPP_TOKEN }
  let fetchParams = fetchOptions

  const requestIDs = fetchOptions.requestIDs
  if (requestIDs) {
    fetchParams = omit(fetchOptions, "requestIDs")
    assign(headers, requestIDHeaders(requestIDs))
  }

  if (accessToken) assign(headers, { "X-ACCESS-TOKEN": accessToken })

  return fetch(
    urljoin(GRAVITY_API_BASE, path),
    assign({}, fetchParams, { headers })
  )
}
