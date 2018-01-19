// @ts-check
import { assign } from "lodash"
import fetch from "./fetch"

const { DIFFUSION_API_BASE, DIFFUSION_TOKEN } = process.env

export default (path, _accessToken, fetchOptions = {}) => {
  const headers = { Accept: "application/json" }
  assign(headers, { Authorization: `Bearer ${DIFFUSION_TOKEN}` })
  return fetch(
    `${DIFFUSION_API_BASE}/${path}`,
    assign({}, fetchOptions, { headers })
  )
}
