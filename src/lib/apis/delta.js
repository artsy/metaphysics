// @ts-check

import fetch from "./fetch"
const { DELTA_API_BASE } = process.env

export default (path, _accessToken, fetchOptions = {}) => fetch(`${DELTA_API_BASE}/${path}`, fetchOptions)
