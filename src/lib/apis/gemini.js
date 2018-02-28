// @ts-check

import fetch from "./fetch"
export default (path, params) => fetch(`${GEMINI_API_BASE}/${path}`, params)
import config from "config"

const { GEMINI_API_BASE } = config
