// @ts-check
import urljoin from "url-join"
import { assign } from "lodash"
import fetch from "./fetch"
import config from "config"

const { CONVECTION_API_BASE } = config

export default (path, accessToken, fetchOptions = {}) => {
  const headers = { Accept: "application/json" }
  if (accessToken) assign(headers, { Authorization: `Bearer ${accessToken}` })
  return fetch(
    urljoin(CONVECTION_API_BASE, path),
    assign({}, fetchOptions, { headers })
  )
}
