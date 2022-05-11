import { Artwork } from "types/runtime/gravity"
import { parse } from "url"

export const isTwoDimensional = ({
  width_cm,
  height_cm,
  depth_cm,
  diameter_cm,
}: Artwork) => {
  // If depth, width, or height are null, we can't be confident it's
  // two-dimensional so we return false.
  if (
    typeof depth_cm === "number" &&
    typeof width_cm === "number" &&
    typeof height_cm === "number"
  ) {
    return (
      // Must have width and height
      width_cm > 0 &&
      height_cm > 0 &&
      // Must not have depth over 10 cm/~4 inches
      depth_cm <= 10 &&
      // Must not have diameter
      (diameter_cm === null || diameter_cm === 0)
    )
  } else {
    return false
  }
}

export const isTooBig = ({ width, height, metric }: Artwork) => {
  const LIMIT = { in: 600, cm: 1524 } // 50 feet

  // It's possible for width/height/metric to be null, so we need to typecheck
  // before we can parse them
  if (
    typeof width === "string" &&
    typeof height === "string" &&
    typeof metric === "string"
  ) {
    return (
      parseFloat(width) > LIMIT[metric] || parseFloat(height) > LIMIT[metric]
    )
  } else {
    return true // assume works are too big if they don't have dimensions
  }
}

export const isEmbeddedVideo = ({ website, category }) =>
  website && website.match("vimeo|youtu") && category && category.match("Video")

export const embed = (website, { width, height, autoplay }) => {
  if (!website) return null

  const { host } = parse(website)
  const id = website.split("/").pop()

  switch (host) {
    case "youtu.be":
    case "youtube.com":
      return `<iframe width='${width}' height='${height}' src='https://www.youtube.com/embed/${id}?rel=0&amp;showinfo=0&amp;autoplay=${
        autoplay // eslint-disable-line max-len
          ? 1
          : 0
      }' frameborder='0' allowfullscreen></iframe>`

    case "vimeo.com":
      return `<iframe width='${width}' height='${height}' src='//player.vimeo.com/video/${id}?color=ffffff&amp;autoplay=${
        autoplay // eslint-disable-line max-len
          ? 1
          : 0
      }' frameborder='0' allowfullscreen></iframe>`

    default:
      return null
  }
}
