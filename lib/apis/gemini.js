// @ts-check

import fetch from "./fetch"
const { GEMINI_API_BASE } = process.env
export default (path, params) => {
  console.log(params)
  return fetch(`${GEMINI_API_BASE}/${path}`, params)
}
