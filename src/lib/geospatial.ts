interface LatLng {
  lat: number
  lng: number
}

const EARTH_RADIUS_IN_METERS = 6371e3

const toRadians = (degrees: number): number => degrees * (Math.PI / 180)

const haversineDistance = (point1: LatLng, point2: LatLng): number => {
  const φ1 = toRadians(point1.lat)
  const φ2 = toRadians(point2.lat)
  const Δφ = toRadians(point2.lat - point1.lat)
  const Δλ = toRadians(point2.lng - point1.lng)

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return EARTH_RADIUS_IN_METERS * c
}

export { haversineDistance as distance }
