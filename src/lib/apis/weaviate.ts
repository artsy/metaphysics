import urljoin from "url-join"
import { assign } from "lodash"
import fetch from "./fetch"
import config from "config"

const { WEAVIATE_API_BASE } = config

export const weaviate = (path, _accessToken, fetchOptions: any = {}) => {
  const headers = { Accept: "application/json" }

  return fetch(
    urljoin(WEAVIATE_API_BASE, path),
    assign({}, fetchOptions, { headers })
  )
}
