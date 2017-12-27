// @ts-check

import fetch from "./fetch"
const { GEMINI_API_BASE } = process.env
export default (path, params) => fetch(`${GEMINI_API_BASE}/${path}`, params)
