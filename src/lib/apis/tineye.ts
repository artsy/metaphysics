import config from "../../config"
import urljoin from "url-join"
import fetch from "./fetch"
import { ReadStream } from "fs"

export type TineyeSearchOptions = {
  image: ReadStream
  filename: string
  contentType: string
}

const tineye = (path: string, fetchOptions) => {
  const baseApi = `https://${config.TINEYE_API_USERNAME}:${config.TINEYE_API_PASSWORD}@mobileengine.tineye.com/artsy/rest`
  const url = urljoin(baseApi, path)

  return fetch(url, fetchOptions)
}

export const tineyeSearch = async (options: TineyeSearchOptions) => {
  const { image, filename, contentType } = options

  const response = await tineye("/search", {
    method: "POST",
    formData: {
      image: {
        value: image,
        options: {
          filename,
          contentType,
        },
      },
    },
  })

  return response.body
}

export default tineye
