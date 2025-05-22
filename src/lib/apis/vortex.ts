import urljoin from "url-join"
import { assign } from "lodash"
import fetch from "./fetch"
import config from "config"

const { VORTEX_API_BASE, VORTEX_TOKEN } = config

export const vortex = (path, accessToken, fetchOptions: any = {}) => {
  const headers = { Accept: "application/json" }
  const token = accessToken || fetchOptions.appToken || VORTEX_TOKEN

  assign(headers, { Authorization: `Bearer ${token}` })

  return fetch(
    urljoin(VORTEX_API_BASE, path),
    assign({}, fetchOptions, { headers })
  )
}
