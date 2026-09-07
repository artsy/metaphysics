import { ResolverContext } from "types/graphql"
import { FixtureItinerary, FixtureItineraryStop } from "./fixtures/itineraries"

/**
 * The three entity kinds a stop's `item_type` can name. `PartnerShow` maps
 * to `ShowType` (Gravity's `shows` endpoint is keyed on the show, not the
 * `PartnerShow` join model — `showsLoader` is the right loader for it).
 */
type StopItemType = "PartnerShow" | "Partner" | "Fair"

const LOADER_BY_ITEM_TYPE: Record<
  StopItemType,
  {
    loaderKey: "showsLoader" | "partnersLoader" | "fairsLoader"
    typename: string
  }
> = {
  PartnerShow: { loaderKey: "showsLoader", typename: "Show" },
  Partner: { loaderKey: "partnersLoader", typename: "Partner" },
  Fair: { loaderKey: "fairsLoader", typename: "Fair" },
}

const isStopItemType = (value: string | null): value is StopItemType =>
  value === "PartnerShow" || value === "Partner" || value === "Fair"

const mapKey = (itemType: string, itemId: string) => `${itemType}:${itemId}`

/** A resolved Show/Partner/Fair, tagged so `ItineraryStopItem`'s
 * `resolveType` can key off `__typename` the same way it already does for
 * fixture data. */
export type ResolvedStopItem = Record<string, unknown> & { __typename: string }

export type StopWithResolvedItem = FixtureItineraryStop & {
  _resolvedItem?: ResolvedStopItem | null
}

/**
 * Batch-resolves every stop's `item_type` / `item_id` into the referenced
 * Show, Partner, or Fair, issuing at most one loader call per type no
 * matter how many stops reference that type. Returns a map keyed by
 * `"<item_type>:<item_id>"`.
 *
 * A missing/unwired loader (e.g. an unauthenticated test context that never
 * stubbed one) is treated as "nothing to resolve" and skipped, matching the
 * `if (!someLoader) return null` guard used elsewhere in this codebase
 * (e.g. `collectionsConnection`). A loader that IS called and rejects
 * (timeout, Gravity 500) is left to reject `Promise.all` and propagate —
 * that failure must surface as a GraphQL error, not a null `item`.
 */
export const loadStopItems = async (
  stops: FixtureItineraryStop[],
  context: ResolverContext
): Promise<Map<string, ResolvedStopItem>> => {
  const idsByType: Record<StopItemType, Set<string>> = {
    PartnerShow: new Set(),
    Partner: new Set(),
    Fair: new Set(),
  }

  for (const { item_type, item_id } of stops) {
    if (item_id && isStopItemType(item_type)) {
      idsByType[item_type].add(item_id)
    }
  }

  const map = new Map<string, ResolvedStopItem>()

  const fetches = (Object.keys(idsByType) as StopItemType[]).map(
    async (itemType) => {
      const ids = Array.from(idsByType[itemType])
      if (ids.length === 0) return

      const { loaderKey, typename } = LOADER_BY_ITEM_TYPE[itemType]
      const loader = context[loaderKey]
      if (!loader) return

      // `showsLoader` resolves directly to an array; `partnersLoader` and
      // `fairsLoader` resolve to `{ body, headers }`, matching each
      // loader's shape elsewhere in the schema (e.g.
      // `notifications/index.ts` vs. `fairs.ts`).
      const result = await loader({ id: ids })
      const records: any[] = Array.isArray(result) ? result : result.body

      // Gravity's `.in(_id: params[:id])` returns matches unordered, and a
      // deleted entity simply doesn't come back — that stop's `item`
      // resolves to null further down, which is correct: a published guide
      // can outlive one of its shows.
      for (const record of records) {
        map.set(mapKey(itemType, record._id), {
          ...record,
          __typename: typename,
        })
      }
    }
  )

  await Promise.all(fetches)

  return map
}

/**
 * Flattens every stop across every section of an itinerary, resolves their
 * items in one batch per type, and stamps the result onto each stop as
 * `_resolvedItem` for `ItineraryStop.item` to read back synchronously.
 *
 * Must be called by every resolver that returns an `Itinerary` — the root
 * `itinerary` field and both `itinerariesConnection` resolvers — or `item`
 * resolves to null on every stop even though the query otherwise succeeds.
 */
export const attachStopItems = async (
  itinerary: FixtureItinerary,
  context: ResolverContext
): Promise<FixtureItinerary> => {
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
