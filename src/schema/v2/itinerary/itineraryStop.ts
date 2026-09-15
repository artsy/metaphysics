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
import { attachStopItemsToMany, StopWithResolvedItem } from "./stopItems"
import { GravityItineraryStop } from "./types"
import { ItineraryType } from "./itinerary"

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

/**
 * The caller's own stops pointing at the same entity as this one.
 *
 * Asked of Gravity by city rather than by entity, so a guide's stops share one request: the
 * loader caches on its params (loader_with_authentication_factory.ts:87-89), and every stop of
 * a guide asks for the same city. Per-entity keying would be a request per stop.
 */
const callersStopsFor = async (
  { item_type, item_id, _citySlug }: StopWithResolvedItem,
  { itineraryStopsLoader }: ResolverContext
): Promise<GravityItineraryStop[]> => {
  // An unauthenticated caller has no itineraries, and a custom stop points at nothing to
  // match against.
  if (!itineraryStopsLoader || !item_type || !item_id) return []

  const mine = await itineraryStopsLoader(
    _citySlug ? { city_slug: _citySlug } : {}
  )

  return mine.filter(
    (stop) => stop.item_type === item_type && stop.item_id === item_id
  )
}

export const ItineraryStopType = new GraphQLObjectType<
  StopWithResolvedItem,
  ResolverContext
>({
  name: "ItineraryStop",
  // A thunk, not an object: `myItineraryStops` returns this same type.
  fields: () => ({
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
    itineraryID: {
      description:
        "The itinerary this stop belongs to. Only sent where Gravity selects it through " +
        "the section, which today means the stops behind `myItineraries`.",
      type: GraphQLString,
      resolve: ({ itinerary_id }) => itinerary_id ?? null,
    },
    isOnMyItinerary: {
      description:
        "Whether the caller already has this stop's entity on an itinerary of their own. " +
        "False for a custom stop, which points at no entity and so cannot be matched.",
      type: new GraphQLNonNull(GraphQLBoolean),
      resolve: async (stop, _args, context) =>
        (await callersStopsFor(stop, context)).length > 0,
    },
    myItineraries: {
      description:
        "The caller's own itineraries holding this stop's entity, so a client can say which " +
        "ones it is already on. Empty when they have not added it, and always empty for a " +
        "custom stop, which points at no entity.",
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(ItineraryType))
      ),
      resolve: async (stop, _args, context) => {
        const mine = await callersStopsFor(stop, context)
        const itineraryIDs = Array.from(
          new Set(mine.map(({ itinerary_id }) => itinerary_id).filter(Boolean))
        ) as string[]

        if (!itineraryIDs.length) return []

        // Fetched by id rather than by listing the caller's itineraries, so the answer cannot
        // be truncated by a page size. There are as many calls as itineraries actually
        // holding the entity — usually one — and the loader caches each, so a guide whose
        // stops share an itinerary asks for it once.
        const itineraries = await Promise.all(
          itineraryIDs.map((id) => context.itineraryLoader!(id))
        )

        // Every resolver returning Itinerary nodes attaches stop items, or a caller reading
        // `myItineraries { sections { stops { item } } }` would silently get nulls.
        return attachStopItemsToMany(itineraries, context)
      },
    },
  }),
})
