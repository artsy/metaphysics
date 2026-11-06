import config from "config"
import urljoin from "url-join"
import fetch from "./fetch"

export const unleash = (
  path: string,
  _accessToken: string,
  fetchOptions: any = {}
) => {
  return fetch(urljoin("https://unleash.artsy.net/api/admin", path), {
    ...fetchOptions,
    headers: {
      "Content-Type": "application/json",
      Authorization: config.UNLEASH_ADMIN_TOKEN,
    },
  })
}
