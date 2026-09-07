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
import { UserType } from "schema/v2/user"
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
    // Gravity settled the association question: `author_id` is a Mongoid
    // `User` id, not a free-text name, so a rename on the user's side
    // tracks automatically instead of going stale in a copied string. The
    // cost, accepted along with the change: a guest byline by someone
    // with no Artsy account can no longer be expressed. Most personal
    // itineraries have no author at all, so a missing `author_id` is the
    // common case, not an edge one — resolve straight to `null` without
    // calling the loader.
    author: {
      type: UserType,
      resolve: ({ author_id }, _args, { userByIDLoader }) => {
        if (!author_id || !userByIDLoader) return null
        return userByIDLoader(author_id).catch(() => null)
      },
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
