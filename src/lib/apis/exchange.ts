import urljoin from "url-join"
import { assign } from "lodash"
import fetch from "./fetch"
import config from "config"

const { EXCHANGE_API_BASE } = config

export default (path, accessToken, fetchOptions = {}) => {
  const headers = {}
  if (accessToken) assign(headers, { Authorization: `Bearer ${accessToken}` })
  console.log("***", headers)
  return fetch(
    urljoin(EXCHANGE_API_BASE, path),
    assign({}, fetchOptions, { headers })
  )
}
