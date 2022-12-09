import config from "config"
import { configureImageServices, ResizeMode } from "@artsy/img"

const { GEMINI_ENDPOINT } = config

const services = configureImageServices({
  gemini: {
    endpoint: GEMINI_ENDPOINT!,
  },
})

const DEFAULT_1X_QUALITY = 80
const DEFAULT_2X_QUALITY = 50
export const DEFAULT_SRCSET_QUALITY = [DEFAULT_1X_QUALITY, DEFAULT_2X_QUALITY]

interface Gemini {
  src: string
  mode: ResizeMode
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
  return services.gemini.exec(mode, src, { width, height, quality })
}
