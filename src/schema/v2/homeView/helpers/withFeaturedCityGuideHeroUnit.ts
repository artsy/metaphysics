import { offsetToCursor } from "graphql-relay"
import { paginationResolver } from "schema/v2/fields/pagination"
import {
  FEATURED_CITY_GUIDE,
  FeaturedCityGuide,
  isFeaturedCityGuideActive,
} from "../sections/featuredCityGuides"

export type HeroUnitsConnection = ReturnType<typeof paginationResolver>

const buildHeroUnit = ({
  citySlug,
  displayStartAt,
  displayEndAt,
  heroUnit: { id, title, body, ctaText, image },
}: FeaturedCityGuide) => ({
  id,
  title,
  body,
  link_text: ctaText,
  link_url: `/city-guide?citySlug=${citySlug}`,
  position: 0,
  start_at: displayStartAt,
  end_at: displayEndAt,
  image: {
    image_url: image.url,
    original_width: image.width,
    original_height: image.height,
    aspect_ratio: image.width / image.height,
  },
})

/**
 * Adds the featured guide's hero unit to the front of the first page. The page
 * grows by one, so the end cursor stays aligned with Gravity's page offsets.
 */
export const withFeaturedCityGuideHeroUnit = (
  connection: HeroUnitsConnection,
  args: {
    first?: number | null
    after?: string | null
    last?: number | null
    before?: string | null
  },
  guide: FeaturedCityGuide = FEATURED_CITY_GUIDE
): HeroUnitsConnection => {
  const isFirstPage = !!args.first && !args.after && !args.last && !args.before
  if (!isFirstPage || !isFeaturedCityGuideActive(guide)) return connection

  const edge = { cursor: offsetToCursor(-1), node: buildHeroUnit(guide) }

  return {
    ...connection,
    totalCount: connection.totalCount + 1,
    edges: [edge, ...connection.edges],
    pageInfo: {
      ...connection.pageInfo,
      startCursor: edge.cursor,
      endCursor: connection.pageInfo.endCursor ?? edge.cursor,
    },
  }
}
