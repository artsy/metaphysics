// @ts-check

import urljoin from "url-join"
import fetch from "./fetch"
import config from "config"

const { DELTA_API_BASE } = config

export default (path, _accessToken, fetchOptions = {}) =>
  fetch(urljoin(DELTA_API_BASE, path), fetchOptions)
