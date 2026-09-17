import {
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"
import { ResolverContext } from "types/graphql"
import { GlobalIDField } from "schema/v2/object_identification"
import { date } from "schema/v2/fields/date"
import { ImageType } from "schema/v2/image"
import { imageFromGravity } from "schema/v2/itinerary/gravityImage"
import { attachStopItemsToMany } from "schema/v2/itinerary/stopItems"
import { VideoType } from "schema/v2/types/Video"
import {
  CityGuideEventArticleType,
  PositronArticle,
} from "./cityGuideEventArticle"
import { CityGuideEventItineraryType } from "./cityGuideEventItinerary"
import { GravityCityGuideEvent } from "./types"

export const CityGuideEventType = new GraphQLObjectType<
  GravityCityGuideEvent,
  ResolverContext
>({
  name: "CityGuideEvent",
  fields: () => ({
    id: GlobalIDField,
    internalID: {
      description: "The city guide event's UUID",
      type: new GraphQLNonNull(GraphQLString),
      resolve: ({ id }) => id,
    },
    slug: {
      type: new GraphQLNonNull(GraphQLString),
      resolve: ({ slug }) => slug,
    },
    title: {
      type: new GraphQLNonNull(GraphQLString),
      resolve: ({ title }) => title,
    },
    subtitle: {
      type: GraphQLString,
      resolve: ({ subtitle }) => subtitle,
    },
    description: {
      type: GraphQLString,
      resolve: ({ description }) => description,
    },
    citySlug: {
      type: new GraphQLNonNull(GraphQLString),
      resolve: ({ city_slug }) => city_slug,
    },
    startAt: date(({ start_at }) => start_at, true),
    endAt: date(({ end_at }) => end_at, true),
    timeZone: {
      type: GraphQLString,
      resolve: ({ time_zone }) => time_zone,
    },
    publishedAt: date(({ published_at }) => published_at),
    heroImage: {
      type: ImageType,
      resolve: ({ image_url, image_urls }) =>
        imageFromGravity(image_url, image_urls),
    },
    itineraries: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(CityGuideEventItineraryType))
      ),
      // Pooled here, once per event, rather than per join row: one loader call
      // per item type for the whole list instead of one per itinerary.
      resolve: async ({ itineraries }, _args, context) => {
        const joins = itineraries ?? []
        await attachStopItemsToMany(
          joins.map((join) => join.itinerary),
          context
        )
        return joins
      },
    },
    articles: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(CityGuideEventArticleType))
      ),
      // One Positron lookup for the whole list, not one per attached article.
      resolve: async ({ articles }, _args, { articlesLoader }) => {
        const joins = articles ?? []
        if (joins.length === 0) return []

        const { results } = await articlesLoader({
          ids: joins.map((join) => join.article_id),
          published: true,
          limit: joins.length,
        })
        const byId = new Map<string, PositronArticle>(
          results.map((article: PositronArticle) => [article.id, article])
        )

        // Drop joins whose article Positron didn't return: either it's an
        // unpublished draft (filtered intentionally by `published: true`) or
        // a dangling reference to a deleted article. Either way, we skip it
        // rather than erroring the whole list.
        return joins.flatMap((join) => {
          const article = byId.get(join.article_id)
          return article ? [{ ...join, article }] : []
        })
      },
    },
    video: {
      type: VideoType,
      // Gravity already embeds the full Video record (eager-loaded on every route), so
      // this is a plain field access, not a loader call — no N+1 risk to pool against.
      resolve: ({ video }) => video ?? null,
    },
    updatedAt: date(({ updated_at }) => updated_at, true),
  }),
})
