import moment from "moment"
import { CityWithGuideSlug } from "./citiesWithGuides"

export interface FeaturedCityGuide {
  citySlug: CityWithGuideSlug
  /** Start of the promotion window (ISO 8601, e.g. one week before the event) */
  displayStartAt: string
  /** End of the promotion window (ISO 8601, exclusive) */
  displayEndAt: string
  pill: {
    title: string
  }
  heroUnit: {
    id: string
    title: string
    body: string
    ctaText: string
    image: { url: string; width: number; height: number }
  }
}

export const FEATURED_CITY_GUIDE: FeaturedCityGuide = {
  // Frieze London
  citySlug: "london-united-kingdom",
  displayStartAt: "2026-10-05T00:00:00Z",
  displayEndAt: "2026-10-25T00:00:00Z",
  pill: {
    title: "London City Guide",
  },
  heroUnit: {
    id: "london-art-week-2026",
    title: "Your Guide to London Art Week",
    body: "All the art highlights between Oct. 14–19.",
    ctaText: "Explore Now",
    image: {
      url: "https://files.artsy.net/images/image-1-1.png",
      width: 360,
      height: 630,
    },
  },
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
