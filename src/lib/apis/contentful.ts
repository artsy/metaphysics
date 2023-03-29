import config from "config"
import { assign } from "lodash"
import urljoin from "url-join"
import fetch from "./fetch"

const {
  CONTENTFUL_API_BASE,
  CONTENTFUL_API_TOKEN,
  CONTENTFUL_ENVIRONMENT_ID,
  CONTENTFUL_SPACE_ID,
} = config

export const contentful = (path: string) => {
  const headers = { Accept: "application/json" }
  const token = CONTENTFUL_API_TOKEN

  assign(headers, { Authorization: `Bearer ${token}` })

  const url = urljoin(
    CONTENTFUL_API_BASE,
    "spaces",
    CONTENTFUL_SPACE_ID,
    "environments",
    CONTENTFUL_ENVIRONMENT_ID,
    // This looks odd, but path has a ? appended to it already.
    // include param determines how many levels of nested content to load
    `${path}include=10`
  )

  return fetch(url, { headers })
}
