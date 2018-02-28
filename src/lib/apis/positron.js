// @ts-check

import fetch from "./fetch"
import config from "config"

export default path => fetch(`${POSITRON_API_BASE}/${path}`)
const { POSITRON_API_BASE } = config
