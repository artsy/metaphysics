import urljoin from "url-join"
import fetch from "./fetch"
import config from "config"

const { GEODATA_API_BASE } = config

export default (path: string) => {
  return fetch(urljoin(GEODATA_API_BASE, path))
}
