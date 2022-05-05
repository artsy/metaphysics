import config from "../../config"
import urljoin from "url-join"
import fetch from "./fetch"

const { TINEYE_API_PASSWORD, TINEYE_API_USERNAME } = config

export default (path: string, fetchOptions) => {
  const baseApi = `https://${TINEYE_API_USERNAME}:${TINEYE_API_PASSWORD}@mobileengine.tineye.com/artsy/rest`
  const url = urljoin(baseApi, path)

  return fetch(url, fetchOptions)
}
