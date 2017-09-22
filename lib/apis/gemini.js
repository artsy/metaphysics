// @ts-check

import { assign } from "lodash"
import fetch from "./fetch"

const { GEMINI_API_BASE } = process.env

export default (path, authToken, fetchOptions = {}) => {
  const headers = {}
  console.log("Sending headers: ", headers)
  return fetch(`${GEMINI_API_BASE}/${path}`, assign({}, fetchOptions, { headers }))
}
