import urljoin from "url-join"
import { assign } from "lodash"
import fetch from "./fetch"
import config from "config"

const { CONVECTION_API_BASE, CONVECTION_TOKEN } = config

export default (path, accessToken, fetchOptions = {}) => {
  const headers = { Accept: "application/json" }
  const token = accessToken || CONVECTION_TOKEN
  if (token) {
    assign(headers, { Authorization: `Bearer ${token}` })
  }
  return fetch(
    urljoin(CONVECTION_API_BASE, path),
    assign({}, fetchOptions, { headers })
  )
}
