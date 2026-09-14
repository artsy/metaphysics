import { GraphQLFieldConfig, GraphQLInt, GraphQLString } from "graphql"
import { pageable } from "relay-cursor-paging"
import { ResolverContext } from "types/graphql"
import {
  ItinerariesConnectionType,
  resolveItinerariesConnection,
} from "schema/v2/itinerary/itinerariesConnection"
import { emptyConnection } from "schema/v2/fields/pagination"

export const MeItinerariesConnection: GraphQLFieldConfig<
  any,
  ResolverContext
> = {
  type: ItinerariesConnectionType,
  description:
    "A connection of the current user's own City Guide itineraries, of any visibility",
  args: pageable({
    citySlug: {
      type: GraphQLString,
      description: "Only itineraries for this city",
    },
    page: { type: GraphQLInt },
    size: { type: GraphQLInt },
  }),
  resolve: (_root, args, context) => {
    const { userID } = context
    if (!userID) return emptyConnection

    return resolveItinerariesConnection(args, context, {
      onlyOwnedBy: userID,
    })
  },
}

export default MeItinerariesConnection
