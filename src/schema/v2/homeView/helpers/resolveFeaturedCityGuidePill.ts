import { OwnerType } from "@artsy/cohesion"
import config from "config"
import moment from "moment"
import { distance, LatLng } from "lib/geospatial"
import { NEAREST_CITY_THRESHOLD_KM } from "schema/v2/city/constants"
import { ResolverContext } from "types/graphql"
import type { NavigationPill } from "../sectionTypes/NavigationPills"
import {
  FEATURED_CITY_GUIDES,
  FeaturedCityGuide,
} from "../sections/featuredCityGuides"
import { CITIES_WITH_GUIDES, CityWithGuide } from "../sections/citiesWithGuides"

const nearestWithinThreshold = <T>(
  latLng: LatLng,
  items: readonly T[],
  getCoordinates: (item: T) => LatLng
): T | null => {
  let closest: T | null = null
  let closestDistance = Infinity

  for (const item of items) {
    const metersAway = distance(latLng, getCoordinates(item))
    if (metersAway < closestDistance) {
      closest = item
      closestDistance = metersAway
    }
  }

  if (closest && closestDistance < NEAREST_CITY_THRESHOLD_KM * 1000) {
    return closest
  }

  return null
}

const activeGuides = (guides: FeaturedCityGuide[]): FeaturedCityGuide[] => {
  const now = moment.utc()

  return guides.filter((guide) => {
    const start = moment.utc(guide.displayStartAt)
    const end = moment.utc(guide.displayEndAt)

    if (!start.isValid() || !end.isValid()) return false

    return now.isSameOrAfter(start) && now.isBefore(end)
  })
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
  guides: FeaturedCityGuide[] = FEATURED_CITY_GUIDES,
  citiesWithGuides: readonly CityWithGuide[] = CITIES_WITH_GUIDES
): Promise<NavigationPill> => {
  const viewerCoordinates = await resolveViewerCoordinates(context)

  if (viewerCoordinates) {
    const guidesWithCities = activeGuides(guides)
      .map((guide) => ({
        guide,
        city: citiesWithGuides.find((city) => city.slug === guide.citySlug),
      }))
      .filter(
        (entry): entry is { guide: FeaturedCityGuide; city: CityWithGuide } =>
          !!entry.city
      )

    const nearest = nearestWithinThreshold(
      viewerCoordinates,
      guidesWithCities,
      (entry) => entry.city.coordinates
    )

    if (nearest) {
      return {
        title: nearest.guide.title,
        href: nearest.guide.href,
        ownerType: OwnerType.cityGuideGuide,
        icon: "MapPinIcon",
        isFeatured: true,
      }
    }
  }

  const nearestCity = viewerCoordinates
    ? nearestWithinThreshold(
        viewerCoordinates,
        citiesWithGuides,
        (city) => city.coordinates
      )
    : null
  const nearestSlug = nearestCity?.slug ?? null

  return {
    title: "City Guide",
    href: nearestSlug ? `/city-guide?citySlug=${nearestSlug}` : "/city-guide",
    ownerType: OwnerType.cityGuideGuide,
    icon: "MapPinIcon",
    isFeatured: false,
  }
}
