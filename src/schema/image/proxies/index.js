import gemini from "./gemini"
import embedly from "./embedly"
import config from "config"

const { RESIZING_SERVICE } = config

module.exports = function resizeWith(...rest) {
  if (RESIZING_SERVICE === "embedly") return embedly(...rest)
  return gemini(...rest)
}
