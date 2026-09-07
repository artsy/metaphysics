import { GraphQLFieldConfig, GraphQLNonNull, GraphQLString } from "graphql"
import { ResolverContext } from "types/graphql"
import { fixtureItinerary } from "./fixtures/itineraries"
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
        "An optional share token; unused by the fixture, reserved for the " +
        "Gravity-backed resolver that authorizes access to unlisted guides",
      type: GraphQLString,
    },
  },
  // TODO: once Gravity ships itineraries, swap this for the Gravity
  // loader, e.g. `itineraryLoader(id, { share_token: shareToken })`.
  resolve: async (_root, { id }, context) => {
    const itinerary = fixtureItinerary(id)
    if (!itinerary) return null

    return attachStopItems(itinerary, context)
  },
}

export default Itinerary
