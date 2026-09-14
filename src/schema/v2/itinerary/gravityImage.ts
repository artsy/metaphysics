export const imageFromGravity = (
  image_url: string | null,
  image_urls: Record<string, string> | null
) => {
  if (image_urls)
    return { image_url, image_urls, image_versions: Object.keys(image_urls) }
  if (image_url && !image_url.includes(":version")) return { image_url }
  return null
}
