import DataLoader from "dataloader"
import { GravityItinerary } from "schema/v2/itinerary/types"

export interface ItineraryStopIdentity {
  item_type?: string | null
  item_id?: string | null
  title?: string | null
  address?: string | null
}

interface MembershipKey {
  stop: ItineraryStopIdentity
  includeItineraries?: boolean
}

export interface ItineraryStopMemberships {
  is_on_my_itineraries: boolean
  my_itineraries?: GravityItinerary[]
}

// Created by the authenticated loader factory, once per GraphQL request.
// Both fields share the queue, so selecting details and the boolean still
// makes one REST call per batch. No user data enters the shared REST cache.
export const createBatchItineraryStopMembershipsLoader = (
  fetchMemberships: (params: {
    stops: string
    include_itineraries: boolean
  }) => Promise<ItineraryStopMemberships[]>
) => {
  const loader = new DataLoader<MembershipKey, ItineraryStopMemberships>(
    async (keys) => {
      const identities = keys.map(({ stop }) => identity(stop))
      const unique = Array.from(new Set(identities))
      const results = await fetchMemberships({
        stops: `[${unique.join(",")}]`,
        include_itineraries: keys.some(
          (key) => key.includeItineraries === true
        ),
      })
      if (results.length !== unique.length) {
        throw new Error("Invalid itinerary stop membership batch response")
      }
      const byIdentity = new Map(
        unique.map((key, index) => [key, results[index]])
      )
      return identities.map((key) => byIdentity.get(key)!)
    },
    {
      maxBatchSize: 20,
      cacheKeyFn: ({ stop, includeItineraries }) =>
        `${identity(stop)}:${!!includeItineraries}`,
    }
  )

  return (stop: ItineraryStopIdentity, includeItineraries = false) =>
    loader.load({ stop, includeItineraries })
}

const identity = (stop: ItineraryStopIdentity) =>
  JSON.stringify(
    stop.item_id
      ? { item_type: stop.item_type, item_id: stop.item_id }
      : { title: stop.title, address: stop.address ?? null }
  )
