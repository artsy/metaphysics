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
import { imageFromGravity } from "./gravityImage"
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
      resolve: ({ image_url, image_urls }) =>
        imageFromGravity(image_url, image_urls),
    },
    publishedAt: date(({ published_at }) => published_at),
    updatedAt: date(({ updated_at }) => updated_at),
    sectionsCount: {
      type: new GraphQLNonNull(GraphQLInt),
      resolve: ({ sections_count }) => sections_count,
    },
    stopsCount: {
      type: GraphQLInt,
      description:
        "How many stops the itinerary has in total. Nullable because the " +
        "listing endpoint only began sending it recently; fall back to " +
        "summing the sections when it is absent.",
      // Gravity sums its sections' counter caches. A caller listing itineraries cannot do
      // that itself: the index serializes at :short, which omits `sections` entirely.
      resolve: ({ stops_count }) => stops_count,
    },
    sections: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(ItinerarySectionType))
      ),
      resolve: ({ sections }) => sortBy(sections, "position"),
    },
  }),
})
