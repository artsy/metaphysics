import config from "config"
import { configureImageServices } from "@artsy/img"

export const DEFAULT_1X_QUALITY = 85
const DEFAULT_2X_QUALITY = 85
export const DEFAULT_SRCSET_QUALITY = [DEFAULT_1X_QUALITY, DEFAULT_2X_QUALITY]

const { GEMINI_ENDPOINT } = config

export const services = configureImageServices({
  gemini: {
    endpoint: GEMINI_ENDPOINT!,
  },
})
