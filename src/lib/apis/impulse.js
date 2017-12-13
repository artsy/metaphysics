// @ts-check

import { assign } from "lodash"
import fetch from "./fetch"

const { IMPULSE_API_BASE } = process.env

export default (path, accessToken, fetchOptions = {}) => {
  const headers = {}
  if (accessToken) assign(headers, { Authorization: `Bearer ${accessToken}` })
  return fetch(`${IMPULSE_API_BASE}/${path}`, assign({}, fetchOptions, { headers }))
}
