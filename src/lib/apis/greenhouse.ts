import urljoin from "url-join"
import fetch from "./fetch"

export const greenhouse = (path: string) => {
  return fetch(
    urljoin("https://boards-api.greenhouse.io/v1/boards/artsy", path)
  )
}
