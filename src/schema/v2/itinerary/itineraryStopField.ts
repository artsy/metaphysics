import { GraphQLFieldConfig, GraphQLNonNull, GraphQLString } from "graphql"
import { HTTPError } from "lib/HTTPError"
import { isFieldRequested } from "lib/isFieldRequested"
import { ResolverContext } from "types/graphql"
import { ItineraryStopType } from "./itineraryStop"
import { attachItemsToStops } from "./stopItems"

export const ItineraryStop: GraphQLFieldConfig<void, ResolverContext> = {
  type: ItineraryStopType,
  description:
    "A single City Guide itinerary stop. Uses the parent itinerary's read permissions.",
  args: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The stop's internal ID",
    },
    shareToken: {
      type: GraphQLString,
      description: "The parent itinerary's share token, when unlisted",
    },
  },
  resolve: async (_root, { id, shareToken }, context, info) => {
    const stop = await context
      .itineraryStopLoader(id, shareToken ? { share_token: shareToken } : {})
      .catch((error) => {
        if (error instanceof HTTPError && error.statusCode === 404) return null
        throw error
      })
    if (!stop) return null

    if (isFieldRequested("item", info) || isFieldRequested("event", info)) {
      await attachItemsToStops([stop], context)
    }
    return stop
  },
}
