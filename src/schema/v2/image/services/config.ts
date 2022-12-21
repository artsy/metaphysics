import config from "config"
import { configureImageServices } from "@artsy/img"

export const DEFAULT_1X_QUALITY = 80
const DEFAULT_2X_QUALITY = 50
export const DEFAULT_SRCSET_QUALITY = [DEFAULT_1X_QUALITY, DEFAULT_2X_QUALITY]

const { GEMINI_ENDPOINT } = config

export const services = configureImageServices({
  gemini: {
    endpoint: GEMINI_ENDPOINT!,
  },
  // TODO: The below should be ENV-ified and have separate staging values?
  lambda: {
    endpoint: "https://d1j88w5k23s1nr.cloudfront.net",
    sources: [
      {
        source: "https://d32dm0rphc51dk.cloudfront.net",
        bucket: "artsy-media-assets",
      },
      {
        source: "https://files.artsy.net",
        bucket: "artsy-vanity-files-production",
      },
      {
        source: "https://artsy-media-uploads.s3.amazonaws.com",
        bucket: "artsy-media-uploads",
      },
    ],
  },
})
