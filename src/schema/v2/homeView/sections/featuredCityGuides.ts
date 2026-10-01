import moment from "moment"
import { CityWithGuideSlug } from "./citiesWithGuides"

export interface FeaturedCityGuide {
  citySlug: CityWithGuideSlug
  title: string
  /** Start of the promotion window (ISO 8601, e.g. one week before the event) */
  displayStartAt: string
  /** End of the promotion window (ISO 8601, exclusive) */
  displayEndAt: string
}

export const FEATURED_CITY_GUIDE: FeaturedCityGuide = {
  // Frieze London
  citySlug: "london-united-kingdom",
  title: "London City Guide",
  displayStartAt: "2026-10-05T00:00:00Z",
  displayEndAt: "2026-10-25T00:00:00Z",
}

export const isFeaturedCityGuideActive = (
  guide: FeaturedCityGuide = FEATURED_CITY_GUIDE
): boolean => {
  const now = moment.utc()
  const start = moment.utc(guide.displayStartAt)
  const end = moment.utc(guide.displayEndAt)

  if (!start.isValid() || !end.isValid()) return false

  return now.isSameOrAfter(start) && now.isBefore(end)
}
