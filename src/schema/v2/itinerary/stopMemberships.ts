import DataLoader from "dataloader"
import { ResolverContext } from "types/graphql"
import { GravityItinerary } from "./types"
import { attachStopItemsToMany } from "./stopItems"

// A query may select myItineraries on many stops. Hydrate their nested items
// together, rather than issuing item-loader requests from each stop resolver.
const itemLoaders = new WeakMap<
  ResolverContext,
  DataLoader<GravityItinerary, GravityItinerary>
>()

export const attachMembershipStopItems = (
  itineraries: GravityItinerary[],
  context: ResolverContext
): Promise<GravityItinerary[]> => {
  let loader = itemLoaders.get(context)
  if (!loader) {
    loader = new DataLoader<GravityItinerary, GravityItinerary>(
      (batch) => attachStopItemsToMany(batch, context),
      { cacheKeyFn: ({ id }) => id }
    )
    itemLoaders.set(context, loader)
  }
  return Promise.all(itineraries.map((itinerary) => loader!.load(itinerary)))
}
