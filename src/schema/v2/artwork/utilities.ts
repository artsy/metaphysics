import { Artwork } from "types/runtime/gravity"
import { parse } from "url"
import qs from "querystring"
import { normalizeImageData } from "../image"
import _ from "lodash"

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

export const isTooBig = ({ width_cm, height_cm, diameter_cm }: Artwork) => {
  const limit_cm = 1524 // 50 feet

  // If we have a diameter, the work is circular and shouldn't have width/height
  if (typeof diameter_cm === "number") {
    return diameter_cm > limit_cm
  } else if (typeof width_cm === "number" && typeof height_cm === "number") {
    return width_cm > limit_cm || height_cm > limit_cm
  } else {
    return true // assume works are too big if they don't have diameter or width/height
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

export const getFigures = ({
  images,
  external_video_id,
  set_video_as_cover,
}) => {
  const _images = images.map((image) => ({
    ...image,
    type: "Image",
  }))
  const sortedImages = normalizeImageData(_.sortBy(_images, "position"))

  let videos = [] as {
    type: string
    playerUrl: string
    width: number
    height: number
  }[]

  if (external_video_id) {
    const { width, height } = qs.parse(external_video_id)

    videos = [
      {
        type: "Video",
        playerUrl: external_video_id,
        width: Number(width),
        height: Number(height),
      },
    ]
  }

  if (set_video_as_cover) {
    return [...videos, ...sortedImages]
  } else {
    return [...sortedImages, ...videos]
  }
}

export const isEligibleForOnPlatformTransaction = ({
  acquireable,
  offerable,
  offerable_from_inquiry,
}) => {
  if (acquireable || offerable || offerable_from_inquiry) {
    return true
  }

  return false
}
