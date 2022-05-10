import config from "../../config"
import urljoin from "url-join"
import fetch, { RequestInit } from "node-fetch"
import FormData from "form-data"
import { Readable } from "stream"

export type TineyeSearchOptions = {
  image: Readable
  filename: string
  contentType: string
}

const tineye = (path: string, fetchOptions?: RequestInit) => {
  const baseApi = `https://${config.TINEYE_API_USERNAME}:${config.TINEYE_API_PASSWORD}@mobileengine.tineye.com/artsy/rest`
  const url = urljoin(baseApi, path)

  return fetch(url, fetchOptions)
}

export const tineyeSearch = async (options: TineyeSearchOptions) => {
  const { image, filename, contentType } = options
  const form = new FormData()

  form.append("image", image, {
    filename,
    contentType,
  })

  const response = await tineye("/search", {
    method: "POST",
    body: form,
  })
  const json = await response.json()

  return json
}

export default tineye
