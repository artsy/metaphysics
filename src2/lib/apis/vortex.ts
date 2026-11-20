import urljoin from "url-join"
import { assign } from "lodash"
import fetch from "./fetch"
import config from "config"
import { decodeUnverifiedJWT } from "lib/decodeUnverifiedJWT"

const { VORTEX_API_BASE, VORTEX_TOKEN } = config

export const vortex = (path, accessToken, fetchOptions: any = {}) => {
  const headers = { Accept: "application/json" }
  const token =
    accessToken || tokenIfPropagatable(fetchOptions.appToken) || VORTEX_TOKEN

  assign(headers, { Authorization: `Bearer ${token}` })

  return fetch(
    urljoin(VORTEX_API_BASE, path),
    assign({}, fetchOptions, { headers })
  )
}

export const tokenIfPropagatable = (token) => {
  const decoded = decodeUnverifiedJWT(token)

  const roles = decoded?.roles.split(",")
  const isEmailProvider = roles?.includes("email_provider")

  // If the token doesn't have the email provider role,
  // we want to fallback to the Vortex token.
  if (!isEmailProvider) {
    return null
  }

  // Return the token with the email provider role
  return token
}
