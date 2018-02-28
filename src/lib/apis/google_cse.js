// @ts-check

import fetch from "./fetch"
import config from "config"

export default path => fetch(`${GOOGLE_CSE_API_BASE}/${path}`)
const { GOOGLE_CSE_API_BASE } = config
