import { GraphQLFieldConfig, GraphQLNonNull, GraphQLString } from "graphql"
import { ResolverContext } from "types/graphql"
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
    // The authenticated loader when there is a viewer, so an owner sees
    // their own private itineraries; the public one otherwise.
    const loader =
      context.itineraryLoader ?? context.unauthenticatedLoaders?.itineraryLoader
    if (!loader) return null

    // A private or missing itinerary is a 404 from Gravity, deliberately —
    // it never confirms that an itinerary it will not show you exists.
    // Either way the field resolves null rather than erroring.
    const itinerary = await loader(
      id,
      shareToken ? { share_token: shareToken } : {}
    ).catch(() => null)
    if (!itinerary) return null

    return attachStopItems(itinerary, context)
  },
}

export default Itinerary
