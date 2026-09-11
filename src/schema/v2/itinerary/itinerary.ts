import { sortBy } from "lodash"
import {
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"
import { ResolverContext } from "types/graphql"
import { GlobalIDField } from "schema/v2/object_identification"
import { date } from "schema/v2/fields/date"
import { ImageType } from "schema/v2/image"
import { GravityItinerary } from "./types"
import { ItinerarySectionType } from "./itinerarySection"

export const ItineraryVisibilityEnum = new GraphQLEnumType({
  name: "ItineraryVisibility",
  values: {
    PRIVATE: { value: "PRIVATE" },
    UNLISTED: { value: "UNLISTED" },
    PUBLIC: { value: "PUBLIC" },
  },
})

const VISIBILITY_BY_GRAVITY = {
  private: "PRIVATE",
  unlisted: "UNLISTED",
  public: "PUBLIC",
} as const

export const ItineraryType = new GraphQLObjectType<
  GravityItinerary,
  ResolverContext
>({
  name: "Itinerary",
  fields: () => ({
    // Not `SlugAndInternalIDFields`: this record has `id` but no `_id`,
    // and `slug` is genuinely nullable.
    id: GlobalIDField,
    internalID: {
      description: "The itinerary's UUID",
      type: new GraphQLNonNull(GraphQLString),
      resolve: ({ id }) => id,
    },
    slug: {
      description:
        "Only published, curated guides have a slug. Null otherwise.",
      type: GraphQLString,
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
    authorName: {
      type: GraphQLString,
      resolve: ({ author_name }) => author_name,
    },
    citySlug: {
      type: new GraphQLNonNull(GraphQLString),
      resolve: ({ city_slug }) => city_slug,
    },
    isCurated: {
      type: new GraphQLNonNull(GraphQLBoolean),
      resolve: ({ is_curated }) => is_curated,
    },
    visibility: {
      type: new GraphQLNonNull(ItineraryVisibilityEnum),
      resolve: ({ visibility }) => VISIBILITY_BY_GRAVITY[visibility],
    },
    shareToken: {
      type: GraphQLString,
      resolve: ({ share_token }) => share_token,
    },
    heroImage: {
      type: ImageType,
      // image_versions is derived from image_urls' keys; Gravity sends no
      // versions array.
      resolve: ({ image_url, image_urls }) =>
        image_urls
          ? { image_url, image_urls, image_versions: Object.keys(image_urls) }
          : null,
    },
    publishedAt: date(({ published_at }) => published_at),
    updatedAt: date(({ updated_at }) => updated_at),
    sectionsCount: {
      type: new GraphQLNonNull(GraphQLInt),
      resolve: ({ sections_count }) => sections_count,
    },
    sections: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(ItinerarySectionType))
      ),
      resolve: ({ sections }) => sortBy(sections, "position"),
    },
  }),
})
