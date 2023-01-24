import { gemini } from "./gemini"
import { imgix } from "./imgix"
import { lambda } from "./lambda"

export const getImageService = (service: string) => {
  if (service === "gemini") {
    return gemini
  }

  if (service === "lambda") {
    return lambda
  }

  if (service === "imgix") {
    return imgix
  }

  return gemini
}
