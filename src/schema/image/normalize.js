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

export const grab = flow(
  pick,
  values,
  first
)

export const setVersion = (
  { image_url, image_urls, image_versions = [] },
  versions
) => {
  const version =
    find(versions, curry(includes)(image_versions)) ||
    last(image_versions.filter(version => version !== "normalized"))
  if (image_urls && version) return image_urls[version]
  if (includes(image_url, ":version") && version) {
    return image_url.replace(":version", version)
  }

  return image_url
}

const normalizeImageUrl = image => {
  const image_url = grab(image, ["url", "image_url"])
  if (!image_url) return null
  return assign({ image_url }, image)
}

const normalizeImageVersions = image => {
  if (image && !includes(image.image_url, ":version")) return image

  const image_versions = grab(image, ["versions", "image_versions"])
  if (!image_versions) return null
  return assign({ image_versions }, image)
}

const normalizeBareUrls = image => {
  if (isString(image)) return { image_url: image }
  return image
}

const normalize = flow(
  normalizeBareUrls,
  normalizeImageUrl,
  normalizeImageVersions
)

export default response => {
  if (isArray(response)) return compact(response.map(normalize))
  return normalize(response)
}
