import gemini from "./gemini"
import embedly from "./embedly"
import config from "config"

const { RESIZING_SERVICE } = config

module.exports = function resizeWith(...args: [any, any, any, any]) {
  return RESIZING_SERVICE === "embedly" ? embedly(...args) : gemini(...args)
}
