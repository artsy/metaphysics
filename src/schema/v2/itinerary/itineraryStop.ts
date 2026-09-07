import {
  GraphQLBoolean,
  GraphQLFloat,
  GraphQLInt,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
  GraphQLUnionType,
} from "graphql"
import { ResolverContext } from "types/graphql"
import { date } from "schema/v2/fields/date"
import { ShowType } from "schema/v2/show"
import { PartnerType } from "schema/v2/partner/partner"
import { FairType } from "schema/v2/fair"
import { FixtureItineraryStop } from "./fixtures/itineraries"

export const ItineraryStopItem = new GraphQLUnionType({
  name: "ItineraryStopItem",
  types: [ShowType, PartnerType, FairType],
  // graphql-js 16 requires `resolveType` to return the type NAME, not the
  // GraphQLObjectType itself — returning the object throws at execution
  // time.
  resolveType: (value) => {
    switch (value?.__typename) {
      case "Show":
        return ShowType.name
      case "Partner":
        return PartnerType.name
      case "Fair":
        return FairType.name
      default:
        return null
    }
  },
})

export const ItineraryStopType = new GraphQLObjectType<
  FixtureItineraryStop,
  ResolverContext
>({
  name: "ItineraryStop",
  fields: {
    internalID: {
      type: new GraphQLNonNull(GraphQLString),
      resolve: ({ id }) => id,
    },
    position: {
      type: new GraphQLNonNull(GraphQLInt),
      resolve: ({ position }) => position,
    },
    title: {
      description: "The editorial override for this stop's display title",
      type: GraphQLString,
      resolve: ({ title }) => title,
    },
    titleOverride: {
      description:
        "The same raw title-override value as `title`, exposed separately for edit forms",
      type: GraphQLString,
      resolve: ({ title_override }) => title_override,
    },
    address: {
      type: GraphQLString,
      resolve: ({ address }) => address,
    },
    addressOverride: {
      type: GraphQLString,
      resolve: ({ address_override }) => address_override,
    },
    imageURL: {
      type: GraphQLString,
      resolve: ({ image_url }) => image_url,
    },
    latitude: {
      type: GraphQLFloat,
      resolve: ({ latitude }) => latitude,
    },
    longitude: {
      type: GraphQLFloat,
      resolve: ({ longitude }) => longitude,
    },
    startAt: date(({ start_at }) => start_at),
    endAt: date(({ end_at }) => end_at),
    note: {
      type: GraphQLString,
      resolve: ({ note }) => note,
    },
    category: {
      description: "MUSEUM | GALLERY | SHOW | FAIR",
      type: GraphQLString,
      resolve: ({ category }) => category,
    },
    isFreeAdmission: {
      type: GraphQLBoolean,
      resolve: ({ is_free_admission }) => is_free_admission,
    },
    eventID: {
      type: GraphQLString,
      resolve: ({ event_id }) => event_id,
    },
    item: {
      description:
        "The Show, Partner, or Fair this stop refers to, if any. A stop " +
        "without an `item_id` (e.g. a café) resolves to null.",
      type: ItineraryStopItem,
      // TODO(part 2): batch-resolve `item_type` / `item_id` into the
      // referenced Show, Partner, or Fair via dataloaders. Until Gravity
      // ships real staging ids, and until that resolution exists, this
      // stays null.
      resolve: () => null,
    },
  },
})
