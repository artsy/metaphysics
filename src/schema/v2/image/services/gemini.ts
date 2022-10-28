import urljoin from "url-join"
import qs from "qs"
import { isExisty } from "lib/helpers"
import config from "config"

const {
  SERVERLESS_IMAGE_ORIGINALS_CDN,
  SERVERLESS_IMAGE_RESIZING_URL,
  GEMINI_ENDPOINT,
  SERVERLESS_IMAGE_RESIZING_WEIGHT,
  SERVERLESS_IMAGE_ORIGINALS_BUCKET,
} = config

const DEFAULT_1X_QUALITY = 80
const DEFAULT_2X_QUALITY = 50
export const DEFAULT_SRCSET_QUALITY = [DEFAULT_1X_QUALITY, DEFAULT_2X_QUALITY]

type Mode = "resize" | "crop"

interface ResizeTo {
  mode: Mode
  width?: number
  height?: number
}

const resizeTo = ({ mode, width, height }: ResizeTo) => {
  if (mode === "crop") {
    return "fill"
  }

  if (isExisty(width) && !isExisty(height)) {
    return "width"
  }

  if (isExisty(height) && !isExisty(width)) {
    return "height"
  }

  return "fit"
}

interface Gemini {
  src: string
  mode: Mode
  width?: number
  height?: number
  quality?: number
}

export const gemini = ({
  src,
  mode,
  width,
  height,
  quality = DEFAULT_1X_QUALITY,
}: Gemini): string => {
  const options = {
    resize_to: resizeTo({ mode, width, height }),
    width,
    height,
    quality,
    src,
  }

  // If eligible for our AWS serverless solution, consider re-directing
  // some requests.
  const isEligibleSource = src.startsWith(SERVERLESS_IMAGE_ORIGINALS_CDN)
  const isEligibleMode = options.resize_to === "fit"

  if (isEligibleMode && isEligibleSource) {
    const generated = Math.random()

    if (generated < SERVERLESS_IMAGE_RESIZING_WEIGHT) {
      const parsed = options.src.split("/")
      const filename = parsed.pop()
      const path = parsed.pop()

      const payload = {
        bucket: SERVERLESS_IMAGE_ORIGINALS_BUCKET,
        key: `${path}/${filename}`,
        edits: {
          resize: {
            width: options.width,
            height: options.height,
            fit: "inside",
          },
        },
      }

      // base-64 encode the payload
      const encodedPayload = Buffer.from(JSON.stringify(payload)).toString(
        "base64"
      )
      return `${SERVERLESS_IMAGE_RESIZING_URL}/${encodedPayload}`
    }
  }
  return urljoin(GEMINI_ENDPOINT, `?${qs.stringify(options)}`)
}
