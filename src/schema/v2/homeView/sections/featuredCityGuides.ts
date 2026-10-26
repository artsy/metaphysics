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
  // New York, Nov 5-20 2026
  citySlug: "new-york-ny-usa",
  title: "New York City Guide",
  displayStartAt: "2026-11-05T00:00:00Z",
  displayEndAt: "2026-11-21T00:00:00Z",
}
