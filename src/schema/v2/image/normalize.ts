import {
  pick,
  values,
  first,
  assign,
  compact,
  flow,
  includes,
  last,
  isArray,
  isString,
  find,
  curry,
} from "lodash"
import { DEFAULT_SRCSET_QUALITY } from "./services/config"

export const grab: any = flow(pick, values, first)

export const setVersion = (
  { image_url, image_urls, image_versions = [] },
  versions
): string => {
  const version =
    find(versions, curry(includes)(image_versions)) ||
    last(image_versions.filter((version) => version !== "normalized"))
  if (image_urls && version) {
    // @ts-ignore
    return image_urls[version]
  }
  if (includes(image_url, ":version") && version) {
    return image_url.replace(":version", version)
  }

  return image_url
}

const normalizeImageUrl = (image) => {
  const image_url = grab(image, ["url", "image_url"])
  if (!image_url) return null
  return assign({ image_url }, image)
}

const normalizeImageVersions = (image) => {
  if (image && !includes(image.image_url, ":version")) return image

  const image_versions = grab(image, ["versions", "image_versions"])
  if (!image_versions) return null
  return assign({ image_versions }, image)
}

const normalizeBareUrls = (image) => {
  if (isString(image)) return { image_url: image }
  return image
}

const _normalize = flow(
  normalizeBareUrls,
  normalizeImageUrl,
  normalizeImageVersions
)

export type ImageData =
  | string
  | {
      url?: string
      image_url?: string
      versions?: string[]
      image_versions?: string[]
    }

type NormalizedImageData = { image_url: string; image_versions: string[] }

export function normalize(response: ImageData): NormalizedImageData
export function normalize(response: ImageData[]): NormalizedImageData[]
export function normalize(response: ImageData | ImageData[]) {
  if (isArray(response)) return compact(response.map(_normalize))
  return _normalize(response)
}

export default normalize

export const normalizeQuality = (quality?: number[]): [number, number] => {
  const [quality1x, quality2x] = quality || DEFAULT_SRCSET_QUALITY

  return [
    Math.max(Math.min(quality1x, 100), 0),
    Math.max(Math.min(quality2x ?? quality1x, 100), 0),
  ]
}
