import config from "config"
import urljoin from "url-join"
import fetch from "./fetch"

const { ARTNET_NEWS_API_BASE } = config

export default (
  path,
  _accessToken?: string | null,
  fetchOptions: Record<string, unknown> = {}
) => {
  return fetch(urljoin(ARTNET_NEWS_API_BASE, path), fetchOptions)
}
