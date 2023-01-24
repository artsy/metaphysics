import { ResizeMode } from "@artsy/img"
import { services, DEFAULT_1X_QUALITY } from "./config"

interface Imgix {
  src: string
  mode: ResizeMode
  width?: number
  height?: number
  quality?: number
}

export const imgix = ({
  src,
  mode,
  width,
  height,
  quality = DEFAULT_1X_QUALITY,
}: Imgix): string => {
  return services.imgix.exec(mode, src, { width, height, quality })
}
