import urljoin from "url-join"
import { assign } from "lodash"
import fetch from "./fetch"
import config from "config"
import { APIOptions } from "lib/loaders/api"

const { CONVECTION_API_BASE, CONVECTION_TOKEN } = config

export default (path, accessToken, fetchOptions: APIOptions = {}) => {
  const headers = { Accept: "application/json" }
  // appToken goes in the headers!!!
  const { appToken, ...optionsForFetch } = fetchOptions
  const token = accessToken || appToken || CONVECTION_TOKEN
  if (token) {
    assign(headers, { Authorization: `Bearer ${token}` })
  }
  return fetch(
    urljoin(CONVECTION_API_BASE, path),
    assign({}, optionsForFetch, { headers })
  )
}
