import urljoin from "url-join"
import qs from "qs"
import { isExisty } from "lib/helpers"
import config from "config"
import { Mode } from "./index"

const { GEMINI_ENDPOINT } = config

function resizeTo(mode: Mode, width?: number, height?: number) {
  if (mode === "crop") {
    return "fill"
  } else if (isExisty(width) && !isExisty(height)) {
    return "width"
  } else if (isExisty(height) && !isExisty(width)) {
    return "height"
  }
  return "fit"
}

export default (
  src: string,
  mode: Mode,
  width?: number,
  height?: number,
  quality = 80
) => {
  const options = {
    resize_to: resizeTo(mode, width, height),
    width,
    height,
    quality,
    src,
  }

  return urljoin(GEMINI_ENDPOINT, `?${qs.stringify(options)}`)
}
