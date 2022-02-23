import { extname } from "path"
import { URL } from "url"

export const isMedia = (url: string) => {
  const uri = new URL(url)
  return extname(uri.pathname) === ".mp4"
}
