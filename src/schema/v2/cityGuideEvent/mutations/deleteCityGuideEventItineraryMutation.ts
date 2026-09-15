import { GraphQLNonNull, GraphQLString } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { formatGravityError } from "lib/gravityErrorHandler"
import { ResolverContext } from "types/graphql"
import { CityGuideEventMutationResponseOrErrorType } from "./cityGuideEventMutationResponseOrError"

interface InputProps {
  id: string
}

export const deleteCityGuideEventItineraryMutation = mutationWithClientMutationId<
  InputProps,
  any,
  ResolverContext
>({
  name: "deleteCityGuideEventItinerary",
  description:
    "Detach an itinerary from a city guide event. The itinerary itself is " +
    "left alone. Returns the event with its remaining itineraries.",
  inputFields: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The attachment's id (not the itinerary's).",
    },
  },
  outputFields: {
    responseOrError: {
      type: CityGuideEventMutationResponseOrErrorType,
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async ({ id }, context) => {
    if (!context.deleteCityGuideEventItineraryLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    try {
      // Gravity returns only the join row; the refetched event is the payload.
      const join = await context.deleteCityGuideEventItineraryLoader(id, {})
      return await context.cityGuideEventLoader(join.city_guide_event_id)
    } catch (error) {
      const formattedErr = formatGravityError(error)

      if (formattedErr) {
        return { ...formattedErr, _type: "GravityMutationError" }
      } else {
        throw error
      }
    }
  },
})
