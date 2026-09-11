import { ResolverContext } from "types/graphql"
import { GravityItinerary, GravityItineraryStop } from "./types"

type StopItemType = "PartnerShow" | "PartnerLocation" | "Fair"

const LOADER_BY_ITEM_TYPE: Record<
  StopItemType,
  {
    loaderKey: "showsLoader" | "fairsLoader" | "partnerLocationsByIdsLoader"
    typename: string
    idKey: "_id" | "id"
    extraParams?: Record<string, unknown>
  }
> = {
  // Gravity's shows index excludes is_local_discovery shows by default.
  PartnerShow: {
    loaderKey: "showsLoader",
    typename: "Show",
    idKey: "_id",
    extraParams: { include_local_discovery: true },
  },
  Fair: { loaderKey: "fairsLoader", typename: "Fair", idKey: "_id" },
  PartnerLocation: {
    loaderKey: "partnerLocationsByIdsLoader",
    typename: "PartnerLocation",
    idKey: "id",
  },
}

const isStopItemType = (value: string | null): value is StopItemType =>
  value === "PartnerShow" || value === "PartnerLocation" || value === "Fair"

const mapKey = (itemType: string, itemId: string) => `${itemType}:${itemId}`

// A resolved Show, Location, or Fair, tagged for `ItineraryStopItem.resolveType`.
export type ResolvedStopItem = Record<string, unknown> & { __typename: string }

// A resolved show or fair event, tagged for `ItineraryStopEvent.resolveType`.
export type ResolvedStopEvent = Record<string, unknown> & {
  __typename: "ShowEventType" | "FairEvent"
}

export type StopWithResolvedItem = GravityItineraryStop & {
  _resolvedItem?: ResolvedStopItem | null
  _resolvedEvent?: ResolvedStopEvent | null
}

// One loader call per item type; returns a map keyed "<item_type>:<item_id>".
export const loadStopItems = async (
  stops: GravityItineraryStop[],
  context: ResolverContext
): Promise<Map<string, ResolvedStopItem>> => {
  const map = new Map<string, ResolvedStopItem>()
  if (stops.length === 0) return map

  const idsByType: Record<StopItemType, Set<string>> = {
    PartnerShow: new Set(),
    PartnerLocation: new Set(),
    Fair: new Set(),
  }

  for (const { item_type, item_id } of stops) {
    if (item_id && isStopItemType(item_type)) {
      idsByType[item_type].add(item_id)
    }
  }

  const fetches = (["PartnerShow", "Fair", "PartnerLocation"] as const).map(
    async (itemType) => {
      const ids = Array.from(idsByType[itemType])
      if (ids.length === 0) return

      const { loaderKey, typename, idKey, extraParams } = LOADER_BY_ITEM_TYPE[
        itemType
      ]
      const loader = context[loaderKey]
      if (!loader) return

      const result = await loader({
        id: ids,
        size: ids.length,
        ...extraParams,
      })
      const records: any[] = Array.isArray(result) ? result : result.body

      for (const record of records) {
        map.set(mapKey(itemType, record[idKey]), {
          ...record,
          __typename: typename,
        })
      }
    }
  )

  await Promise.all(fetches)

  return map
}

// One `fairEventsLoader` call per distinct fair id; returns each fair's
// events keyed by id.
const loadFairEvents = async (
  fairIds: string[],
  context: ResolverContext
): Promise<Map<string, Map<string, Record<string, unknown>>>> => {
  const byFairId = new Map<string, Map<string, Record<string, unknown>>>()
  const loader = context.fairEventsLoader
  if (!loader || fairIds.length === 0) return byFairId

  await Promise.all(
    fairIds.map(async (fairId) => {
      const result = await loader(fairId)
      const events: any[] = Array.isArray(result) ? result : result.body
      const byEventId = new Map<string, Record<string, unknown>>()
      for (const event of events) {
        byEventId.set(event.id, event)
      }
      byFairId.set(fairId, byEventId)
    })
  )

  return byFairId
}

// The event a stop names, if any. Always null, never undefined.
const resolveStopEvent = (
  stop: StopWithResolvedItem,
  fairEventsByFairId: Map<string, Map<string, Record<string, unknown>>>
): ResolvedStopEvent | null => {
  if (!stop.event_id) return null

  if (stop.event_type === "PartnerShowEvent") {
    const events = (stop._resolvedItem?.events as any[]) ?? []
    const event = events.find((candidate) => candidate._id === stop.event_id)
    return event ? { ...event, __typename: "ShowEventType" } : null
  }

  if (stop.event_type === "FairEvent" && stop.item_id) {
    const event = fairEventsByFairId.get(stop.item_id)?.get(stop.event_id)
    return event ? { ...event, __typename: "FairEvent" } : null
  }

  return null
}

// Loads and stamps `_resolvedItem` and `_resolvedEvent` on each stop.
export const attachItemsToStops = async (
  stops: StopWithResolvedItem[],
  context: ResolverContext
): Promise<StopWithResolvedItem[]> => {
  const itemsByKey = await loadStopItems(stops, context)

  for (const stop of stops) {
    stop._resolvedItem =
      stop.item_id && isStopItemType(stop.item_type)
        ? itemsByKey.get(mapKey(stop.item_type, stop.item_id)) ?? null
        : null
  }

  const fairIds = Array.from(
    new Set(
      stops
        .filter((stop) => stop.event_type === "FairEvent" && stop.item_id)
        .map((stop) => stop.item_id as string)
    )
  )
  const fairEventsByFairId = await loadFairEvents(fairIds, context)

  for (const stop of stops) {
    stop._resolvedEvent = resolveStopEvent(stop, fairEventsByFairId)
  }

  return stops
}

// Call from every resolver that returns Itinerary nodes, once per page.
// Tolerates list payloads with no sections.
export const attachStopItemsToMany = async <T extends GravityItinerary>(
  itineraries: T[],
  context: ResolverContext
): Promise<T[]> => {
  const stops: StopWithResolvedItem[] = itineraries.flatMap((itinerary) =>
    (itinerary.sections ?? []).flatMap((section) => section.stops ?? [])
  )

  await attachItemsToStops(stops, context)

  return itineraries
}

export const attachStopItems = async (
  itinerary: GravityItinerary,
  context: ResolverContext
): Promise<GravityItinerary> => {
  const [attached] = await attachStopItemsToMany([itinerary], context)
  return attached
}
