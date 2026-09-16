import {
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLFloat,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
  GraphQLUnionType,
} from "graphql"
import { ResolverContext } from "types/graphql"
import { date } from "schema/v2/fields/date"
import { ImageType } from "schema/v2/image"
import { imageFromGravity } from "./gravityImage"
import { ShowType } from "schema/v2/show"
import { LocationType } from "schema/v2/location"
import { FairType } from "schema/v2/fair"
import ShowEventType from "schema/v2/show_event"
import { FairEventType } from "schema/v2/fairEvent"
import { StopWithResolvedItem } from "./stopItems"
import { attachMembershipStopItems } from "./stopMemberships"
import { ItineraryType } from "./itinerary"
import { isFieldRequested } from "lib/isFieldRequested"
import { GlobalIDField } from "schema/v2/object_identification"
import {
  ItineraryStopMembershipType,
  itineraryStopMemberships,
} from "./itineraryStopMembership"

export const ItineraryStopCategory = new GraphQLEnumType({
  name: "ItineraryStopCategory",
  values: {
    MUSEUM: { value: "MUSEUM" },
    GALLERY: { value: "GALLERY" },
    SHOW: { value: "SHOW" },
    FAIR: { value: "FAIR" },
  },
})

export const ItineraryStopItemType = new GraphQLEnumType({
  name: "ItineraryStopItemType",
  description: "What kind of item a stop points at",
  values: {
    SHOW: { value: "PartnerShow" },
    LOCATION: { value: "PartnerLocation" },
    FAIR: { value: "Fair" },
  },
})

export const ItineraryStopEventType = new GraphQLEnumType({
  name: "ItineraryStopEventType",
  description: "What kind of event a stop names",
  values: {
    SHOW_EVENT: { value: "PartnerShowEvent" },
    FAIR_EVENT: { value: "FairEvent" },
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

export const ItineraryStopEvent = new GraphQLUnionType({
  name: "ItineraryStopEvent",
  types: [ShowEventType, FairEventType],
  resolveType: (value) => {
    switch (value?.__typename) {
      case "ShowEventType":
        return ShowEventType.name
      case "FairEvent":
        return FairEventType.name
      default:
        return undefined
    }
  },
})

export const ItineraryStopType = new GraphQLObjectType<
  StopWithResolvedItem,
  ResolverContext
>({
  name: "ItineraryStop",
  fields: () => ({
    id: GlobalIDField,
    isOnMyItineraries: {
      description:
        "Whether this stop occurs in any of the current user's personal itineraries. " +
        "Matches Artsy items by type and ID (including events of that item), " +
        "and custom stops by exact title and address. False when signed out.",
      type: GraphQLBoolean,
      resolve: async (stop, _args, { itineraryStopMembershipsLoader }) => {
        if (!itineraryStopMembershipsLoader) return false
        const result = await itineraryStopMembershipsLoader(stop)
        return result.is_on_my_itineraries
      },
    },
    myItineraries: {
      description:
        "The current user's personal itineraries containing this stop, newest first. " +
        "Uses the same matching rules as isOnMyItineraries. " +
        "Details are fetched only when this field is selected. Empty when signed out.",
      type: new GraphQLList(new GraphQLNonNull(ItineraryType)),
      resolve: async (stop, _args, context, info) => {
        if (!context.itineraryStopMembershipsLoader) return []
        const result = await context.itineraryStopMembershipsLoader(stop, true)
        const itineraries = result.my_itineraries ?? []
        if (
          isFieldRequested("sections.stops.item", info) ||
          isFieldRequested("sections.stops.event", info)
        ) {
          return attachMembershipStopItems(itineraries, context)
        }
        return itineraries
      },
    },
    myItineraryStopMemberships: {
      description:
        "The current user's personal itineraries containing an equivalent stop, " +
        "with every matching stop ID grouped by itinerary. Empty when signed out.",
      type: new GraphQLList(new GraphQLNonNull(ItineraryStopMembershipType)),
      resolve: async (stop, _args, { itineraryStopMembershipsLoader }) => {
        if (!itineraryStopMembershipsLoader) return []
        const result = await itineraryStopMembershipsLoader(stop, true)
        return itineraryStopMemberships(stop, result.my_itineraries ?? [])
      },
    },
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
    image: {
      type: ImageType,
      description:
        "The stop's uploaded image; null until Gemini processing " +
        "finishes.",
      resolve: ({ image_url, image_urls }) =>
        imageFromGravity(image_url, image_urls),
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
    itemType: {
      description: "What kind of item this stop points at, if any",
      type: ItineraryStopItemType,
      resolve: ({ item_type }) => item_type,
    },
    eventType: {
      description:
        "SHOW_EVENT on a show stop, FAIR_EVENT on a fair stop; null when " +
        "the stop names no event.",
      type: ItineraryStopEventType,
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
    event: {
      description:
        "The event this stop names inside its show or fair, when any",
      type: ItineraryStopEvent,
      resolve: ({ _resolvedEvent }) => _resolvedEvent ?? null,
    },
  }),
})
