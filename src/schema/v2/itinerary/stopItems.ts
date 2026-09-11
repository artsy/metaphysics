import { ResolverContext } from "types/graphql"
import { GravityItinerary, GravityItineraryStop } from "./types"

type StopItemType = "PartnerShow" | "PartnerLocation" | "Fair"

const LOADER_BY_ITEM_TYPE: Record<
  StopItemType,
  {
    loaderKey: "showsLoader" | "fairsLoader" | "partnerLocationsByIdsLoader"
    typename: string
    idKey: "_id" | "id"
  }
> = {
  PartnerShow: { loaderKey: "showsLoader", typename: "Show", idKey: "_id" },
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

export type StopWithResolvedItem = GravityItineraryStop & {
  _resolvedItem?: ResolvedStopItem | null
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

      const { loaderKey, typename, idKey } = LOADER_BY_ITEM_TYPE[itemType]
      const loader = context[loaderKey]
      if (!loader) return

      const result = await loader({ id: ids, size: ids.length })
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

// Call from every resolver that returns Itinerary nodes, once per page.
// Tolerates list payloads with no sections.
export const attachStopItemsToMany = async <T extends GravityItinerary>(
  itineraries: T[],
  context: ResolverContext
): Promise<T[]> => {
  const stops: StopWithResolvedItem[] = itineraries.flatMap((itinerary) =>
    (itinerary.sections ?? []).flatMap((section) => section.stops ?? [])
  )

  const itemsByKey = await loadStopItems(stops, context)

  for (const stop of stops) {
    stop._resolvedItem =
      stop.item_id && isStopItemType(stop.item_type)
        ? itemsByKey.get(mapKey(stop.item_type, stop.item_id)) ?? null
        : null
  }

  return itineraries
}

export const attachStopItems = async (
  itinerary: GravityItinerary,
  context: ResolverContext
): Promise<GravityItinerary> => {
  const [attached] = await attachStopItemsToMany([itinerary], context)
  return attached
}
