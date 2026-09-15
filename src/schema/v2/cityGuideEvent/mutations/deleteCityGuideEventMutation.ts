import { GraphQLNonNull, GraphQLString } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { formatGravityError } from "lib/gravityErrorHandler"
import { ResolverContext } from "types/graphql"
import { CityGuideEventMutationResponseOrErrorType } from "./cityGuideEventMutationResponseOrError"

interface InputProps {
  id: string
}

export const deleteCityGuideEventMutation = mutationWithClientMutationId<
  InputProps,
  any,
  ResolverContext
>({
  name: "deleteCityGuideEvent",
  description:
    "Delete a city guide event and its itinerary attachments. The " +
    "itineraries themselves are left alone.",
  inputFields: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The event's id or slug.",
    },
  },
  outputFields: {
    responseOrError: {
      type: CityGuideEventMutationResponseOrErrorType,
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async ({ id }, context) => {
    if (!context.deleteCityGuideEventLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    try {
      return await context.deleteCityGuideEventLoader(id, {})
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
