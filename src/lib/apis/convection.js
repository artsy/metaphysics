// @ts-check
import { assign } from "lodash"
import fetch from "./fetch"

const { CONVECTION_API_BASE } = process.env

export default (path, accessToken, fetchOptions = {}) => {
  const headers = { Accept: "application/json" }
  if (accessToken) assign(headers, { Authorization: `Bearer ${accessToken}` })
  return fetch(
    `${CONVECTION_API_BASE}/${path}`,
    assign({}, fetchOptions, { headers })
  )
}
