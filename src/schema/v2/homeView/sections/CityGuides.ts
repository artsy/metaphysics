import { ContextModule } from "@artsy/cohesion"
import { connectionFromArray } from "graphql-relay"
import { compact } from "lodash"
import { ResolverContext } from "types/graphql"
import { cityShowsParams } from "schema/v2/city/cityShowsParams"
import type { TCity } from "schema/v2/city"
import { HomeViewSection } from "."
import { HomeViewSectionTypeNames } from "../sectionTypes/names"
import { withHomeViewTimeout } from "../helpers/withHomeViewTimeout"
import type { HomeViewCityGuideCard } from "../sectionTypes/CityGuides"
import {
  CITIES_WITH_GUIDES,
  CityWithGuide,
  CityWithGuideSlug,
} from "./citiesWithGuides"

const citiesWithGuides = <T extends CityWithGuideSlug>(slugs: readonly T[]) =>
  slugs

/** The cities shown in the rail, in display order */
export const HOME_VIEW_CITY_GUIDE_SLUGS = citiesWithGuides([
  "london-united-kingdom",
  "new-york-ny-usa",
  "miami-fl-usa",
  "berlin-germany",
  "paris-france",
] as const)

type HomeViewCityGuideSlug = typeof HOME_VIEW_CITY_GUIDE_SLUGS[number]

const NEAR_ME_IMAGE_URL =
  "https://files.artsy.net/images/city-guide-city-petzel-gallery.webp"

const CITY_IMAGE_URLS: Record<HomeViewCityGuideSlug, string> = {
  "london-united-kingdom":
    "https://files.artsy.net/images/city-guide-miami.webp",
  "new-york-ny-usa": "https://files.artsy.net/images/city-guide-new-york.webp",
  "miami-fl-usa": "https://files.artsy.net/images/city-guide-miami.webp",
  "berlin-germany": "https://files.artsy.net/images/city-guide-new-york.webp",
  "paris-france": "https://files.artsy.net/images/city-guide-miami.webp",
}

const OPENING_SOON_DAY_THRESHOLD = 14
const MAX_DISPLAYED_COUNT = 100

export const countLabel = (
  count: number | null,
  singular: string,
  plural: string
): string | null => {
  if (!count) return null

  const displayed =
    count > MAX_DISPLAYED_COUNT ? `${MAX_DISPLAYED_COUNT}+` : `${count}`

  return `${displayed} ${count === 1 ? singular : plural}`
}

const totalCount = async (
  request: Promise<{ headers: Record<string, string> }>
): Promise<number | null> => {
  try {
    const { headers } = await request
    const count = parseInt(headers["x-total-count"] ?? "", 10)
    return Number.isNaN(count) ? null : count
  } catch {
    return null
  }
}

const COUNT_ONLY = { size: 1, total_count: true }

const loadCityCounts = async (
  city: CityWithGuide,
  { unauthenticatedLoaders }: ResolverContext
) => {
  const { showsWithHeadersLoader, itinerariesLoader } = unauthenticatedLoaders

  const tCity: TCity = {
    slug: city.slug,
    name: city.name,
    full_name: city.name,
    coords: [city.coordinates.lat, city.coordinates.lng],
  }

  const [currentShows, openingShows, curatedGuides] = await Promise.all([
    totalCount(
      showsWithHeadersLoader({
        ...cityShowsParams(tCity, { status: "RUNNING" }),
        ...COUNT_ONLY,
      })
    ),
    totalCount(
      showsWithHeadersLoader({
        ...cityShowsParams(tCity, {
          status: "UPCOMING",
          dayThreshold: OPENING_SOON_DAY_THRESHOLD,
        }),
        ...COUNT_ONLY,
      })
    ),
    totalCount(
      itinerariesLoader({
        city_slug: city.slug,
        is_curated: true,
        ...COUNT_ONLY,
      })
    ),
  ])

  const shows =
    currentShows === null || openingShows === null
      ? null
      : currentShows + openingShows

  return { shows, curatedGuides }
}

export const CityGuides: HomeViewSection = {
  id: "home-view-section-city-guides",
  type: HomeViewSectionTypeNames.HomeViewSectionCityGuides,
  // TODO: replace with a dedicated context module once added to cohesion
  contextModule: ContextModule.cityGuideCard,
  component: {
    title: "Discover the art that makes your city special",
    description: "Then create your own way to experience it",
    behaviors: {
      viewAll: {
        buttonText: "City Guide",
        href: "/city-guide",
      },
    },
  },
  requiresAuthentication: false,
  featureFlag: "onyx_home-view-city-guide",
  minimumEigenVersion: { major: 9, minor: 23, patch: 0 },

  resolver: withHomeViewTimeout(async (_parent, args, context, _info) => {
    const cities = HOME_VIEW_CITY_GUIDE_SLUGS.map(
      (slug) => CITIES_WITH_GUIDES.find((city) => city.slug === slug)!
    )

    const counts = await Promise.all(
      cities.map((city) => loadCityCounts(city, context))
    )

    const cityCards: HomeViewCityGuideCard[] = cities.map((city, index) => ({
      citySlug: city.slug,
      title: city.name,
      href: `/city-guide?citySlug=${city.slug}`,
      imageURL: CITY_IMAGE_URLS[HOME_VIEW_CITY_GUIDE_SLUGS[index]],
      chips: compact([
        countLabel(
          counts[index].curatedGuides,
          "Curated Guide",
          "Curated Guides"
        ),
        countLabel(counts[index].shows, "Show", "Shows"),
      ]),
    }))

    const nearMeCard: HomeViewCityGuideCard = {
      citySlug: null,
      title: "Explore city near me",
      href: "/city-guide",
      imageURL: NEAR_ME_IMAGE_URL,
      chips: [],
    }

    return connectionFromArray([...cityCards, nearMeCard], args)
  }),
}
