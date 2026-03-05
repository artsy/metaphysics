import config from "config"
import { assign } from "lodash"
import urljoin from "url-join"
import fetch from "./fetch"

const { POSITRON_API_BASE } = config

export default (path, accessToken?: string | null, fetchOptions: Record<string, unknown> = {}) => {
  const headers: Record<string, string> = {}

  if (accessToken) headers["X-ACCESS-TOKEN"] = accessToken

  return fetch(urljoin(POSITRON_API_BASE, path), assign({}, fetchOptions, { headers }))
}
