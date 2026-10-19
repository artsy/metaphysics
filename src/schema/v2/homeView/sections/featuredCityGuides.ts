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
  // Paris, Oct 18-25 2026
  citySlug: "paris-france",
  title: "Paris City Guide",
  displayStartAt: "2026-10-18T00:00:00Z",
  displayEndAt: "2026-10-26T00:00:00Z",
}
