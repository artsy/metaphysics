import config from "config"
import urljoin from "url-join"
import fetch from "./fetch"

export const vimeo = (path: string, fetchOptions: any = {}) => {
  return fetch(urljoin(config.VIMEO_API_BASE, path), {
    ...fetchOptions,
    headers: {
      "Content-Type": "application/json",
      Authorization: `bearer ${config.VIMEO_API_TOKEN}`,
    },
  })
}
