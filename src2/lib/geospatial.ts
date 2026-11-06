/**
 * Represents a latitude/longitude coordinate pair
 */
export interface LatLng {
  /** Latitude in decimal degrees */
  lat: number

  /** Longitude in decimal degrees */
  lng: number
}

/**
 * Represents a geospatial point feature
 */
export interface Point {
  coordinates: LatLng
}

const EARTH_RADIUS_IN_METERS = 6371e3 // https://en.wikipedia.org/wiki/Earth_radius#Mean_radius

/**
 * Convert angular distance from degrees to radians
 *
 * @param {number} degrees - decimal degrees
 * @returns {number} radians
 */
const toRadians = (degrees: number): number => degrees * (Math.PI / 180)

/**
 * Calculates the haversine (spherical) distance between two geographic points.
 *
 * See:
 * https://en.wikipedia.org/wiki/Haversine_formula
 * https://www.movable-type.co.uk/scripts/latlong.html
 *
 * @returns Distance between point1 and point2, in meters
 */
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
