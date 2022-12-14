import { gemini } from "./gemini"
import { lambda } from "./lambda"

export const getImageService = (service: string) => {
  if (service === "gemini") {
    return gemini
  }

  if (service === "lambda") {
    return lambda
  }

  return gemini
}
