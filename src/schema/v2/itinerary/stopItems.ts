import { ResolverContext } from "types/graphql"
import { GravityItinerary, GravityItineraryStop } from "./types"

type StopItemType = "PartnerShow" | "PartnerLocation" | "Fair"

const LOADER_BY_ITEM_TYPE: Record<
  "PartnerShow" | "Fair",
  {
    loaderKey: "showsLoader" | "fairsLoader"
    typename: string
  }
> = {
  PartnerShow: { loaderKey: "showsLoader", typename: "Show" },
  Fair: { loaderKey: "fairsLoader", typename: "Fair" },
}

const isStopItemType = (value: string | null): value is StopItemType =>
  value === "PartnerShow" || value === "PartnerLocation" || value === "Fair"

const mapKey = (itemType: string, itemId: string) => `${itemType}:${itemId}`

// A resolved Show/Partner/Fair, tagged for `ItineraryStopItem.resolveType`.
export type ResolvedStopItem = Record<string, unknown> & { __typename: string }

export type StopWithResolvedItem = GravityItineraryStop & {
  _resolvedItem?: ResolvedStopItem | null
}

// Batch-resolves every stop's item into the referenced Show, Partner, or
// Fair, at most one loader call per type. Returns a map keyed by
// `"<item_type>:<item_id>"`.
export const loadStopItems = async (
  stops: GravityItineraryStop[],
  context: ResolverContext
): Promise<Map<string, ResolvedStopItem>> => {
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

  const map = new Map<string, ResolvedStopItem>()

  const fetches = (["PartnerShow", "Fair"] as const).map(async (itemType) => {
    const ids = Array.from(idsByType[itemType])
    if (ids.length === 0) return

    const { loaderKey, typename } = LOADER_BY_ITEM_TYPE[itemType]
    const loader = context[loaderKey]
    if (!loader) return

    const result = await loader({ id: ids })
    const records: any[] = Array.isArray(result) ? result : result.body

    for (const record of records) {
      map.set(mapKey(itemType, record._id), {
        ...record,
        __typename: typename,
      })
    }
  })

  // Gravity has no batch route for locations, so these go one request each.
  const locationIds = Array.from(idsByType.PartnerLocation)
  const locationLoader = context.partnerLocationByIdLoader
  if (locationIds.length > 0 && locationLoader) {
    await Promise.all(
      locationIds.map(async (id) => {
        const location = await locationLoader(id).catch(() => null)
        if (location) {
          map.set(mapKey("PartnerLocation", id), {
            ...location,
            __typename: "PartnerLocation",
          })
        }
      })
    )
  }

  await Promise.all(fetches)

  return map
}

// Must be called by every resolver that returns an `Itinerary`, or `item`
// resolves to null on every stop.
export const attachStopItems = async (
  itinerary: GravityItinerary,
  context: ResolverContext
): Promise<GravityItinerary> => {
  const stops: StopWithResolvedItem[] = itinerary.sections.flatMap(
    (section) => section.stops
  )

  const itemsByKey = await loadStopItems(stops, context)

  for (const stop of stops) {
    stop._resolvedItem =
      stop.item_id && isStopItemType(stop.item_type)
        ? itemsByKey.get(mapKey(stop.item_type, stop.item_id)) ?? null
        : null
  }

  return itinerary
}
