import urljoin from "url-join"
import fetch from "./fetch"
import config from "config"

const { VIMEO_API_BASE, VIMEO_TOKEN } = config

export const vimeo = (path: string) => {
  return fetch(urljoin(VIMEO_API_BASE, path), {
    headers: { Authorization: `Bearer ${VIMEO_TOKEN}` },
  })
}
