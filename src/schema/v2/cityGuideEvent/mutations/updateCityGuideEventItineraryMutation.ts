import { GraphQLInt, GraphQLNonNull, GraphQLString } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { formatGravityError } from "lib/gravityErrorHandler"
import { ResolverContext } from "types/graphql"
import { CityGuideEventMutationResponseOrErrorType } from "./cityGuideEventMutationResponseOrError"

interface InputProps {
  clientMutationId?: string
  id: string
  position: number
}

export const updateCityGuideEventItineraryMutation = mutationWithClientMutationId<
  InputProps,
  any,
  ResolverContext
>({
  name: "updateCityGuideEventItinerary",
  description:
    "Move an itinerary within its city guide event's list. Returns the " +
    "event with its itineraries in their new order.",
  inputFields: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The attachment's id (not the itinerary's).",
    },
    position: {
      type: new GraphQLNonNull(GraphQLInt),
      description:
        "Zero-based position among the event's itineraries, via " +
        "acts_as_list's insert_at.",
    },
  },
  outputFields: {
    responseOrError: {
      type: CityGuideEventMutationResponseOrErrorType,
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async ({ id, position }, context) => {
    if (!context.updateCityGuideEventItineraryLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    try {
      // Gravity returns only the join row.
      const join = await context.updateCityGuideEventItineraryLoader(id, {
        position,
      })
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
