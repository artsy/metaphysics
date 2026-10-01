import { offsetToCursor } from "graphql-relay"
import {
  FEATURED_CITY_GUIDE,
  isFeaturedCityGuideActive,
} from "../sections/featuredCityGuides"

const buildHeroUnit = () => ({
  id: "london-art-week-2026",
  title: "Your Guide to London Art Week",
  body: "All the art highlights between Oct. 14–19.",
  link_text: "Explore Now",
  link_url: `/city-guide?citySlug=${FEATURED_CITY_GUIDE.citySlug}`,
  position: 0,
  start_at: FEATURED_CITY_GUIDE.displayStartAt,
  end_at: FEATURED_CITY_GUIDE.displayEndAt,
  image: {
    image_url:
      "https://files.artsy.net/images/e7697c5f36292b4d34bc00d0e46e22d44966284b.png",
    original_width: 2880,
    original_height: 1200,
  },
})

export const withFeaturedCityGuideHeroUnit = (
  connection: any,
  args: { first?: number; after?: string }
) => {
  if (args.after || !isFeaturedCityGuideActive()) return connection

  const edge = { cursor: offsetToCursor(-1), node: buildHeroUnit() }
  const edges = [edge, ...connection.edges]
  const isOverPageSize = !!args.first && edges.length > args.first
  const pageEdges = isOverPageSize ? edges.slice(0, args.first) : edges

  return {
    ...connection,
    totalCount: connection.totalCount + 1,
    edges: pageEdges,
    pageInfo: {
      ...connection.pageInfo,
      startCursor: edge.cursor,
      endCursor: pageEdges[pageEdges.length - 1].cursor,
      hasNextPage: connection.pageInfo.hasNextPage || isOverPageSize,
    },
  }
}
