import urljoin from "url-join"
import { assign, omit } from "lodash"
import fetch from "./fetch"
import config from "config"
import { headers as requestIDHeaders } from "../requestIDs"
import { resolveBlueGreen } from "lib/helpers"

const {
  GRAVITY_API_BASE,
  GRAVITY_API_BASE_GREEN,
  GRAVITY_API_PERCENT_REDIRECT,
} = config

export default function gravity(
  path,
  accessToken?: string | null,
  fetchOptions: any = {}
) {
  const headers = {
    "X-XAPP-TOKEN": fetchOptions.appToken || config.GRAVITY_XAPP_TOKEN,
  }
  let fetchParams = fetchOptions

  const requestIDs = fetchOptions.requestIDs
  if (requestIDs) {
    fetchParams = omit(fetchOptions, "requestIDs")
    assign(headers, requestIDHeaders(requestIDs))
  }

  if (accessToken) assign(headers, { "X-ACCESS-TOKEN": accessToken })

  return fetch(
    urljoin(
      resolveBlueGreen(
        GRAVITY_API_BASE!,
        GRAVITY_API_BASE_GREEN!,
        GRAVITY_API_PERCENT_REDIRECT
      ),
      path
    ),
    assign({}, fetchParams, { headers })
  )
}
