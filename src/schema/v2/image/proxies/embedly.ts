import urljoin from "url-join"
import qs from "qs"
import config from "config"
import { Mode } from "./index"

const { EMBEDLY_KEY, EMBEDLY_ENDPOINT } = config

export default (
  src: string,
  mode: Mode,
  width?: number,
  height?: number,
  quality = 80
) => {
  const options = {
    crop: {
      url: src,
      width,
      height,
      key: EMBEDLY_KEY,
      quality,
    },
    resize: {
      grow: false,
      url: src,
      width,
      height,
      key: EMBEDLY_KEY,
      quality,
    },
  }
  return urljoin(EMBEDLY_ENDPOINT, `${mode}?${qs.stringify(options[mode])}`)
}
