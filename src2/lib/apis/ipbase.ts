import urljoin from "url-join"
import fetch from "./fetch"
import config from "config"

const apiBase = "https://api.ipbase.com"
const headers = { apiKey: config.IPBASE_API_KEY }

export const ipbase = (path: string) => {
  return fetch(urljoin(apiBase, path), { headers })
}
