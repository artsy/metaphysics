import { GraphQLFieldConfig, GraphQLNonNull, GraphQLString } from "graphql"
import { ResolverContext } from "types/graphql"
import { HTTPError } from "lib/HTTPError"
import { ItineraryType } from "./itinerary"
import { attachStopItems } from "./stopItems"

export const Itinerary: GraphQLFieldConfig<void, ResolverContext> = {
  type: ItineraryType,
  description: "A City Guide itinerary",
  args: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The internal ID or slug of the Itinerary",
    },
    shareToken: {
      description:
        "The share token for an unlisted itinerary. Gravity returns 404 " +
        "without it, so a caller who is neither the owner nor holding the " +
        "token cannot tell an unlisted guide from one that does not exist.",
      type: GraphQLString,
    },
  },
  resolve: async (_root, { id, shareToken }, context) => {
    const loader =
      context.itineraryLoader ?? context.unauthenticatedLoaders?.itineraryLoader
    if (!loader) return null

    // Gravity 404s a private/missing itinerary; resolve null rather than erroring.
    const itinerary = await loader(
      id,
      shareToken ? { share_token: shareToken } : {}
    ).catch((error) => {
      if (error instanceof HTTPError && error.statusCode === 404) return null
      throw error
    })
    if (!itinerary) return null

    return attachStopItems(itinerary, context)
  },
}

export default Itinerary
