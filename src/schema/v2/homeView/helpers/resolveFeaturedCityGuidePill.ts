import { OwnerType } from "@artsy/cohesion"
import config from "config"
import moment from "moment"
import { distance, LatLng } from "lib/geospatial"
import { NEAREST_CITY_THRESHOLD_KM } from "schema/v2/city/constants"
import { ResolverContext } from "types/graphql"
import type { NavigationPill } from "../sectionTypes/NavigationPills"
import {
  FEATURED_CITY_GUIDE,
  FeaturedCityGuide,
} from "../sections/featuredCityGuides"
import { CITIES_WITH_GUIDES, CityWithGuide } from "../sections/citiesWithGuides"

const nearestCityWithinThreshold = (
  latLng: LatLng,
  cities: readonly CityWithGuide[]
): CityWithGuide | null => {
  let closest: CityWithGuide | null = null
  let closestDistance = Infinity

  for (const city of cities) {
    const metersAway = distance(latLng, city.coordinates)
    if (metersAway < closestDistance) {
      closest = city
      closestDistance = metersAway
    }
  }

  if (closest && closestDistance < NEAREST_CITY_THRESHOLD_KM * 1000) {
    return closest
  }

  return null
}

const isActive = (guide: FeaturedCityGuide): boolean => {
  const now = moment.utc()
  const start = moment.utc(guide.displayStartAt)
  const end = moment.utc(guide.displayEndAt)

  if (!start.isValid() || !end.isValid()) return false

  return now.isSameOrAfter(start) && now.isBefore(end)
}

const resolveViewerCoordinates = async (
  context: ResolverContext
): Promise<{ lat: number; lng: number } | null> => {
  if (!config.ENABLE_IP_BASED_LOCATION || !context.ipAddress) return null

  try {
    const {
      body: { data: locationData },
    } = await context.requestLocationLoader({ ip: context.ipAddress })

    if (!locationData?.location) return null

    return {
      lat: locationData.location.latitude,
      lng: locationData.location.longitude,
    }
  } catch (error) {
    console.error(error)
    return null
  }
}

export const resolveFeaturedCityGuidePill = async (
  context: ResolverContext,
  guide: FeaturedCityGuide = FEATURED_CITY_GUIDE,
  citiesWithGuides: readonly CityWithGuide[] = CITIES_WITH_GUIDES
): Promise<NavigationPill> => {
  if (isActive(guide)) {
    return {
      title: guide.title,
      href: `/city-guide?citySlug=${guide.citySlug}`,
      ownerType: OwnerType.cityGuideGuide,
      icon: "MapPinIcon",
      isFeatured: true,
    }
  }

  const viewerCoordinates = await resolveViewerCoordinates(context)
  const nearestCity = viewerCoordinates
    ? nearestCityWithinThreshold(viewerCoordinates, citiesWithGuides)
    : null

  return {
    title: "City Guide",
    href: nearestCity
      ? `/city-guide?citySlug=${nearestCity.slug}`
      : "/city-guide",
    ownerType: OwnerType.cityGuideGuide,
    icon: "MapPinIcon",
    isFeatured: false,
  }
}
