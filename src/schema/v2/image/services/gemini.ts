import urljoin from "url-join"
import { isExisty, toQueryString } from "lib/helpers"
import config from "config"

const { GEMINI_ENDPOINT } = config

const DEFAULT_1X_QUALITY = 80
const DEFAULT_2X_QUALITY = 50
export const DEFAULT_SRCSET_QUALITY = [DEFAULT_1X_QUALITY, DEFAULT_2X_QUALITY]

type Mode = "resize" | "crop"

interface ResizeTo {
  mode: Mode
  width?: number
  height?: number
}

const resizeTo = ({ mode, width, height }: ResizeTo) => {
  if (mode === "crop") {
    return "fill"
  }

  if (isExisty(width) && !isExisty(height)) {
    return "width"
  }

  if (isExisty(height) && !isExisty(width)) {
    return "height"
  }

  return "fit"
}

interface Gemini {
  src: string
  mode: Mode
  width?: number
  height?: number
  quality?: number
}

export const gemini = ({
  src,
  mode,
  width,
  height,
  quality = DEFAULT_1X_QUALITY,
}: Gemini): string => {
  const options = {
    resize_to: resizeTo({ mode, width, height }),
    width,
    height,
    quality,
    src,
  }

  const queryParams = toQueryString(options)

  return urljoin(GEMINI_ENDPOINT, `?${queryParams}`)
}
