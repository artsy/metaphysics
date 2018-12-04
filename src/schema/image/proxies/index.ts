import gemini from "./gemini"
import embedly from "./embedly"
import config from "config"

const { RESIZING_SERVICE } = config

module.exports = function resizeWith() {
  if (RESIZING_SERVICE === "embedly") return embedly.apply(null, arguments)
  return gemini.apply(null, arguments)
}
