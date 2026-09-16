import {
  GraphQLBoolean,
  GraphQLFieldConfigMap,
  GraphQLList,
  GraphQLNonNull,
} from "graphql"
import { ResolverContext } from "types/graphql"
import {
  ItineraryStopMembershipType,
  itineraryStopMemberships,
} from "./itineraryStopMembership"

interface ItemIdentity {
  id: string
  _id?: string
}

/** Uses the same request-scoped batch as stop memberships, including across item types. */
export const itemItineraryMembershipFields = (
  itemType: "PartnerShow" | "Fair"
): GraphQLFieldConfigMap<ItemIdentity, ResolverContext> => {
  const identity = (item: ItemIdentity) => ({
    item_type: itemType,
    item_id: item._id ?? item.id,
  })

  return {
    isOnMyItineraries: {
      description:
        "Whether this item occurs in any of the current user's personal itineraries. False when signed out.",
      type: GraphQLBoolean,
      resolve: async (item, _args, { itineraryStopMembershipsLoader }) => {
        if (!itineraryStopMembershipsLoader) return false
        const result = await itineraryStopMembershipsLoader(identity(item))
        return result.is_on_my_itineraries
      },
    },
    myItineraryStopMemberships: {
      description:
        "Personal itineraries containing this item, with every matching stop ID. Details are fetched only when selected. Empty when signed out.",
      type: new GraphQLList(new GraphQLNonNull(ItineraryStopMembershipType)),
      resolve: async (item, _args, { itineraryStopMembershipsLoader }) => {
        if (!itineraryStopMembershipsLoader) return []
        const stop = identity(item)
        const result = await itineraryStopMembershipsLoader(stop, true)
        return itineraryStopMemberships(stop, result.my_itineraries ?? [])
      },
    },
  }
}
