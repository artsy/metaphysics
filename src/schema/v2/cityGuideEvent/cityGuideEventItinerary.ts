import { GraphQLInt, GraphQLNonNull, GraphQLObjectType, GraphQLString } from "graphql"
import { ResolverContext } from "types/graphql"
import { GlobalIDField } from "schema/v2/object_identification"
import { ItineraryType } from "schema/v2/itinerary/itinerary"
import { attachStopItems } from "schema/v2/itinerary/stopItems"
import { GravityCityGuideEventItinerary } from "./types"

// A join row (an itinerary attached to a city guide event), not the itinerary itself.
// internalID here is the attachment's own id, needed to reorder or detach it later.
export const CityGuideEventItineraryType = new GraphQLObjectType<
  GravityCityGuideEventItinerary,
  ResolverContext
>({
  name: "CityGuideEventItinerary",
  fields: () => ({
    id: GlobalIDField,
    internalID: {
      description: "The attachment's own UUID, not the itinerary's",
      type: new GraphQLNonNull(GraphQLString),
      resolve: ({ id }) => id,
    },
    position: {
      type: new GraphQLNonNull(GraphQLInt),
      resolve: ({ position }) => position,
    },
    itinerary: {
      type: new GraphQLNonNull(ItineraryType),
      resolve: ({ itinerary }, _args, context) =>
        attachStopItems(itinerary, context),
    },
  }),
})
