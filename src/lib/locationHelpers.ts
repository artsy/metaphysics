import config from "config"
import { isString } from "lodash"
import { CloudflareGeo } from "lib/cloudflareGeo"

interface Location {
  lat: number
  lng: number
  maxDistance?: number
}

const DEFAULT_MAX_DISTANCE_KM = 75
const { ENABLE_IP_BASED_LOCATION } = config

export const getLocationArgs = async ({
  ip,
  maxDistance,
  near,
  requestLocationLoader,
  cfGeo,
}: {
  ip?: string
  maxDistance?: number
  near?: Location
  requestLocationLoader: any
  cfGeo?: CloudflareGeo | null
}) => {
  let location = near

  // Prefer Cloudflare edge coordinates, avoiding an IPBase call.
  if (!location && cfGeo?.lat != null && cfGeo?.lng != null) {
    location = { lat: cfGeo.lat, lng: cfGeo.lng }
  }

  if (ENABLE_IP_BASED_LOCATION && !location && ip) {
    try {
      const {
        body: { data: locationData },
      } = await requestLocationLoader({ ip })

      if (locationData.location) {
        location = {
          lat: locationData.location.latitude,
          lng: locationData.location.longitude,
        }
      }
    } catch (error) {
      console.error(error)
    }
  }

  if (!location) return {}

  return {
    near: isString(near) ? near : `${location.lat},${location.lng}`,
    max_distance:
      maxDistance || location.maxDistance || DEFAULT_MAX_DISTANCE_KM,
  }
}
