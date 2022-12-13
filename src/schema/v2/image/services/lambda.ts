import { ResizeMode } from "@artsy/img"
import { services, DEFAULT_1X_QUALITY } from "./config"

interface Lambda {
  src: string
  mode: ResizeMode
  width?: number
  height?: number
  quality?: number
}

export const lambda = ({
  src,
  mode,
  width,
  height,
  quality = DEFAULT_1X_QUALITY,
}: Lambda): string => {
  return services.lambda.exec(mode, src, { width, height, quality })
}
