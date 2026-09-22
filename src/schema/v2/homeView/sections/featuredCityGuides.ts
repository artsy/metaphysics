import { CityWithGuideSlug } from "./citiesWithGuides"

export interface FeaturedCityGuide {
  citySlug: CityWithGuideSlug
  title: string
  href: string
  /** Start of the promotion window (ISO 8601, e.g. one week before the event) */
  displayStartAt: string
  /** End of the promotion window (ISO 8601, exclusive) */
  displayEndAt: string
}

export const FEATURED_CITY_GUIDES: FeaturedCityGuide[] = [
  {
    // Frieze London
    citySlug: "london-united-kingdom",
    title: "London City Guide",
    href: "/city-guide?citySlug=london-united-kingdom",
    displayStartAt: "2026-09-22T00:00:00Z",
    displayEndAt: "2026-10-26T00:00:00Z",
  },
  {
    // Frieze Berlin
    citySlug: "berlin-germany",
    title: "Berlin City Guide",
    href: "/city-guide?citySlug=berlin-germany",
    displayStartAt: "2026-09-21T00:00:00Z",
    displayEndAt: "2026-10-26T00:00:00Z",
  },
]
