import { GraphQLNonNull, GraphQLString } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { snakeCaseKeys } from "lib/helpers"
import { formatGravityError } from "lib/gravityErrorHandler"
import { ResolverContext } from "types/graphql"
import { CityGuideEventMutationResponseOrErrorType } from "./cityGuideEventMutationResponseOrError"

interface InputProps {
  clientMutationId?: string
  cityGuideEventID: string
  itineraryID: string
}

export const createCityGuideEventItineraryMutation = mutationWithClientMutationId<
  InputProps,
  any,
  ResolverContext
>({
  name: "createCityGuideEventItinerary",
  description:
    "Attach a curated itinerary to a city guide event, at the end of its " +
    "list. Returns the event with its itineraries in their new order.",
  inputFields: {
    cityGuideEventID: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The event's id or slug.",
    },
    itineraryID: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The itinerary's id or slug. Must be a curated guide.",
    },
  },
  outputFields: {
    responseOrError: {
      type: CityGuideEventMutationResponseOrErrorType,
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    { clientMutationId: _clientMutationId, ...attributes },
    context
  ) => {
    if (!context.createCityGuideEventItineraryLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    try {
      // Gravity returns only the join row.
      const join = await context.createCityGuideEventItineraryLoader(
        snakeCaseKeys(attributes)
      )
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
