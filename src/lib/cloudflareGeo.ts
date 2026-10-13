import config from "config"

export interface CloudflareGeo {
  countryCode?: string
  city?: string
  lat?: number
  lng?: number
}

// Cloudflare sentinels for an undeterminable country (and Tor).
const UNKNOWN_COUNTRY = new Set(["XX", "T1", ""])

/**
 * Visitor geo from Cloudflare edge headers, present on any request that
 * transited Cloudflare. `cf-ipcountry` is always set; the lat/lng/city
 * headers require the "Add visitor location headers" managed transform.
 * Returns null when disabled, not behind Cloudflare, or country is unknown —
 * callers then fall back to the IPBase loader.
 */
export const requestCloudflareGeo = (req: {
  headers: Record<string, any>
}): CloudflareGeo | null => {
  if (!config.ENABLE_CLOUDFLARE_GEO) return null

  const countryCode = req.headers["cf-ipcountry"] as string | undefined
  if (!countryCode || UNKNOWN_COUNTRY.has(countryCode)) return null

  const lat = parseFloat(req.headers["cf-iplatitude"])
  const lng = parseFloat(req.headers["cf-iplongitude"])

  return {
    countryCode,
    city: (req.headers["cf-ipcity"] as string) || undefined,
    lat: Number.isFinite(lat) ? lat : undefined,
    lng: Number.isFinite(lng) ? lng : undefined,
  }
}
