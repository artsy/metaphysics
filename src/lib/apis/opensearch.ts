import urljoin from "url-join"
import { assign } from "lodash"
import config from "config"
import fetch from "node-fetch"

const { OPENSEARCH_API_BASE } = config

export const opensearch = async (
  path,
  _accessToken,
  fetchOptions: any = {}
) => {
  const headers = {
    Accept: "application/json",
    "Content-Type": "application/json",
  }

  const response = await (
    await fetch(
      urljoin(OPENSEARCH_API_BASE, path),
      assign({}, fetchOptions, { headers })
    )
  ).json()

  return response
}
