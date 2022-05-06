import config from "../../config"
import urljoin from "url-join"
import fetch from "./fetch"

export default (path: string, fetchOptions) => {
  const baseApi = `https://${config.TINEYE_API_USERNAME}:${config.TINEYE_API_PASSWORD}@mobileengine.tineye.com/artsy/rest`
  const url = urljoin(baseApi, path)

  return fetch(url, fetchOptions)
}
