// @ts-check

import fetch from "./fetch"
import config from "config"

const { DELTA_API_BASE } = config

export default (path, _accessToken, fetchOptions = {}) =>
  fetch(`${DELTA_API_BASE}/${path}`, fetchOptions)
