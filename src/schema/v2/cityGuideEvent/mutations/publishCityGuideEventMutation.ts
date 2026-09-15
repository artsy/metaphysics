import { GraphQLNonNull, GraphQLString } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { formatGravityError } from "lib/gravityErrorHandler"
import { ResolverContext } from "types/graphql"
import { CityGuideEventMutationResponseOrErrorType } from "./cityGuideEventMutationResponseOrError"

interface InputProps {
  id: string
}

// Separate from `updateCityGuideEvent`: Gravity role-checks this transition
// and records who published and when.
export const publishCityGuideEventMutation = mutationWithClientMutationId<
  InputProps,
  any,
  ResolverContext
>({
  name: "publishCityGuideEvent",
  description:
    "Publish a city guide event, making it visible to everyone. Needs the " +
    "editorial or content-manager role.",
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
    if (!context.publishCityGuideEventLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    try {
      return await context.publishCityGuideEventLoader(id, {})
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
