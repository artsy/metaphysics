import { assign, omit } from "lodash"
import fetch from "./fetch"
import config from "config"

const { GRAVITY_API_BASE } = process.env

export default (path, accessToken, fetchOptions = {}) => {
  const requestID = fetchOptions.requestID
  const fetchParams = omit(fetchOptions, "requestID")
  const headers = { "X-XAPP-TOKEN": config.GRAVITY_XAPP_TOKEN, "X-Request-Id": requestID }
  if (accessToken) assign(headers, { "X-ACCESS-TOKEN": accessToken })
  return fetch(`${GRAVITY_API_BASE}/${path}`, assign({}, fetchParams, { headers }))
}
