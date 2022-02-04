import gemini from "./gemini"

export type Mode = "resize" | "crop"

export type ResizeWith = (
  src: string,
  mode: Mode,
  width?: number,
  height?: number,
  quality?: number
) => string

export const resizeWith: ResizeWith = (...args) => {
  return gemini(...args)
}

export default resizeWith
