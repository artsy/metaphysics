// @ts-check

import urljoin from "url-join"
import { assign } from "lodash"
import fetch from "./fetch"
import config from "config"

const { DIFFUSION_API_BASE, DIFFUSION_TOKEN } = config

export default (path, _accessToken, fetchOptions = {}) => {
  const headers = { Accept: "application/json" }
  assign(headers, { Authorization: `Bearer ${DIFFUSION_TOKEN}` })
  return fetch(
    urljoin(DIFFUSION_API_BASE, path),
    assign({}, fetchOptions, { headers })
  )
}
