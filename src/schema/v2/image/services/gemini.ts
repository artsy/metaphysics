import { ResizeMode } from "@artsy/img"
import { services, DEFAULT_1X_QUALITY } from "./config"

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
