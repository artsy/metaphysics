import { OwnerType } from "@artsy/cohesion"
import moment from "moment"
import type { NavigationPill } from "../sectionTypes/NavigationPills"
import {
  FEATURED_CITY_GUIDE,
  FeaturedCityGuide,
} from "../sections/featuredCityGuides"

const isActive = (guide: FeaturedCityGuide): boolean => {
  const now = moment.utc()
  const start = moment.utc(guide.displayStartAt)
  const end = moment.utc(guide.displayEndAt)

  if (!start.isValid() || !end.isValid()) return false

  return now.isSameOrAfter(start) && now.isBefore(end)
}

export const resolveFeaturedCityGuidePill = (
  guide: FeaturedCityGuide = FEATURED_CITY_GUIDE
): NavigationPill => {
  if (isActive(guide)) {
    return {
      title: guide.title,
      href: `/city-guide?citySlug=${guide.citySlug}`,
      ownerType: OwnerType.cityGuideGuide,
      icon: "MapPinIcon",
      isFeatured: true,
    }
  }

  return {
    title: "City Guide",
    href: "/city-guide",
    ownerType: OwnerType.cityGuideGuide,
    icon: "MapPinIcon",
    isFeatured: false,
  }
}
