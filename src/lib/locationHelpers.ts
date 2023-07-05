import { isString } from "lodash"

interface Location {
  lat: number
  lng: number
  maxDistance?: number
}

const DEFAULT_MAX_DISTANCE_KM = 75

export const getLocationArgs = async ({
  ip,
  maxDistance,
  near,
  requestLocationLoader,
}: {
  ip?: string
  maxDistance?: number
  near?: Location
  requestLocationLoader: any
}) => {
  let location = near

  if (!location && ip) {
    const {
      body: { data: locationData },
    } = await requestLocationLoader({ ip })

    if (locationData.location) {
      location = {
        lat: locationData.location.latitude,
        lng: locationData.location.longitude,
      }
    }
  }

  if (!location) return {}

  return {
    near: isString(near) ? near : `${location.lat},${location.lng}`,
    max_distance:
      maxDistance || location.maxDistance || DEFAULT_MAX_DISTANCE_KM,
  }
}
