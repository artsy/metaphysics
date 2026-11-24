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
  // Miami, Nov 24-Dec 6 2026
  citySlug: "miami-fl-usa",
  title: "Miami Guide",
  displayStartAt: "2026-11-24T00:00:00Z",
  displayEndAt: "2026-12-07T00:00:00Z",
}
