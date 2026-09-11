import {
  GraphQLBoolean,
  GraphQLEnumType,
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
import { LocationType } from "schema/v2/location"
import { FairType } from "schema/v2/fair"
import { StopWithResolvedItem } from "./stopItems"

export const ItineraryStopCategory = new GraphQLEnumType({
  name: "ItineraryStopCategory",
  values: {
    MUSEUM: { value: "MUSEUM" },
    GALLERY: { value: "GALLERY" },
    SHOW: { value: "SHOW" },
    FAIR: { value: "FAIR" },
  },
})

export const ItineraryStopItem = new GraphQLUnionType({
  name: "ItineraryStopItem",
  types: [ShowType, LocationType, FairType],
  // Must return the type NAME, not the GraphQLObjectType itself.
  resolveType: (value) => {
    switch (value?.__typename) {
      case "Show":
        return ShowType.name
      case "PartnerLocation":
        return LocationType.name
      case "Fair":
        return FairType.name
      default:
        return null
    }
  },
})

export const ItineraryStopType = new GraphQLObjectType<
  StopWithResolvedItem,
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
    address: {
      type: GraphQLString,
      resolve: ({ address }) => address,
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
    timeZone: {
      description:
        "IANA identifier saying which wall clock startAt and endAt were " +
        "written against, e.g. Europe/London. Pass it to those fields as " +
        "`timezone` to render the time the curator meant.",
      type: GraphQLString,
      resolve: ({ time_zone }) => time_zone,
    },
    note: {
      type: GraphQLString,
      resolve: ({ note }) => note,
    },
    category: {
      type: ItineraryStopCategory,
      resolve: ({ category }) => category,
    },
    isFreeAdmission: {
      type: GraphQLBoolean,
      resolve: ({ is_free_admission }) => is_free_admission,
    },
    eventType: {
      description:
        "PartnerShowEvent on a show stop, FairEvent on a fair stop. Null " +
        "when the stop names no event.",
      type: GraphQLString,
      resolve: ({ event_type }) => event_type,
    },
    eventID: {
      type: GraphQLString,
      resolve: ({ event_id }) => event_id,
    },
    sourceURL: {
      description: "Where the curator found this stop",
      type: GraphQLString,
      resolve: ({ source_url }) => source_url,
    },
    item: {
      description:
        "The Show, gallery location, or Fair this stop refers to, if " +
        "any. A stop " +
        "without an `item_id` (e.g. a café) resolves to null.",
      type: ItineraryStopItem,
      // `_resolvedItem` is filled by `attachStopItems`, which every
      // resolver returning an `Itinerary` must call first.
      resolve: ({ _resolvedItem }) => _resolvedItem ?? null,
    },
  },
})
