import urljoin from "url-join"
import { assign } from "lodash"
import fetch from "./fetch"
import config from "config"

const { DIFFUSION_API_BASE, DIFFUSION_TOKEN } = config

export default (path, accessToken, fetchOptions = {}) => {
  const headers = { Accept: "application/json" }
  const token = accessToken || DIFFUSION_TOKEN
  assign(headers, { Authorization: `Bearer ${token}` })
  return fetch(
    urljoin(DIFFUSION_API_BASE, path),
    assign({}, fetchOptions, { headers })
  )
}
