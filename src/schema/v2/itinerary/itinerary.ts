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
import { FixtureItinerary } from "./fixtures/itineraries"
import { ItinerarySectionType } from "./itinerarySection"

export const ItineraryVisibilityEnum = new GraphQLEnumType({
  name: "ItineraryVisibility",
  values: {
    PRIVATE: { value: "PRIVATE" },
    UNLISTED: { value: "UNLISTED" },
    PUBLIC: { value: "PUBLIC" },
  },
})

// Gravity has no `visibility` column for itineraries — it's derived from
// the presence of `published_at` / `share_token`:
//   - published_at present -> PUBLIC (a published, curated guide)
//   - else share_token present -> UNLISTED (shareable via link only)
//   - else -> PRIVATE
const deriveVisibility = ({
  published_at,
  share_token,
}: FixtureItinerary): "PRIVATE" | "UNLISTED" | "PUBLIC" => {
  if (published_at) return "PUBLIC"
  if (share_token) return "UNLISTED"
  return "PRIVATE"
}

export const ItineraryType = new GraphQLObjectType<
  FixtureItinerary,
  ResolverContext
>({
  name: "Itinerary",
  fields: () => ({
    // Deliberately not `SlugAndInternalIDFields`: that helper resolves
    // `internalID` from `_id` (non-null) and `slug` from `id` (non-null).
    // Gravity's itinerary payload is an ActiveRecord record — it has `id`
    // and a genuinely-nullable `slug`, and no `_id` at all. Using the
    // helper here would return the UUID as the slug and null for a
    // non-nullable field.
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
    name: {
      type: new GraphQLNonNull(GraphQLString),
      resolve: ({ name }) => name,
    },
    subtitle: {
      type: GraphQLString,
      resolve: ({ subtitle }) => subtitle,
    },
    description: {
      type: GraphQLString,
      resolve: ({ description }) => description,
    },
    // Free text, not a `User` association. A public curated guide renders
    // for anonymous readers, and Gravity's user endpoint 403s any caller
    // who isn't the user themselves, customer support, or has the
    // `editorial`/`partner_support` role — so an anonymous reader would get
    // no byline at all. A copied string can go stale, but it at least
    // always renders.
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
      resolve: (itinerary) => deriveVisibility(itinerary),
    },
    shareToken: {
      type: GraphQLString,
      resolve: ({ share_token }) => share_token,
    },
    // `ImageType`, not `GravityARImageType`: this is the type the rest of
    // the schema uses for images, and it gives clients `resized(width:
    // height:)` so the client can request the dimensions it actually needs
    // instead of pulling the full-size hero. This deliberately diverges
    // from `ViewingRoom`, which uses the thin type for the same kind of
    // data — don't "fix" it back to match.
    heroImage: {
      type: ImageType,
      resolve: ({ image }) => image,
    },
    publishedAt: date(({ published_at }) => published_at),
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
