// @ts-check
import { assign, omit } from "lodash"
import fetch from "./fetch"
import config from "config"

const { GRAVITY_API_BASE } = process.env

export default (path, accessToken, fetchOptions = {}) => {
  const headers = { "X-XAPP-TOKEN": config.GRAVITY_XAPP_TOKEN }
  let fetchParams = fetchOptions

  const requestIDs = fetchOptions.requestIDs
  if (requestIDs) {
    fetchParams = omit(fetchOptions, "requestIDs")
    assign(headers, {
      "X-Request-Id": requestIDs.requestID,
      "x-datadog-trace-id": requestIDs.traceId,
      "x-datadog-parent-id": requestIDs.parentSpanId,
    })
  }

  if (accessToken) assign(headers, { "X-ACCESS-TOKEN": accessToken })

  return fetch(`${GRAVITY_API_BASE}/${path}`, assign({}, fetchParams, { headers }))
}
