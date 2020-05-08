import gemini from "./gemini"
import embedly from "./embedly"
import config from "config"

const { RESIZING_SERVICE } = config

export type Mode = "resize" | "crop"

export type ResizeWith = (
  src: string,
  mode: Mode,
  width?: number,
  height?: number,
  quality?: number
) => string

export const resizeWith: ResizeWith = (...args) => {
  return RESIZING_SERVICE === "embedly" ? embedly(...args) : gemini(...args)
}

export default resizeWith
