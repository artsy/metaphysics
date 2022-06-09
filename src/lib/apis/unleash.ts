import config from "config"
import urljoin from "url-join"
import fetch from "./fetch"

export const unleash = (path: string) => {
  return fetch(urljoin("https://unleash.artsy.net/api/admin", path), {
    headers: {
      "Content-Type": "application/json",
      Authorization: config.UNLEASH_ADMIN_TOKEN,
    },
  })
}
