import { GraphQLNonNull, GraphQLString } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { formatGravityError } from "lib/gravityErrorHandler"
import { ResolverContext } from "types/graphql"
import { CityGuideEventMutationResponseOrErrorType } from "./cityGuideEventMutationResponseOrError"

interface InputProps {
  id: string
}

export const unpublishCityGuideEventMutation = mutationWithClientMutationId<
  InputProps,
  any,
  ResolverContext
>({
  name: "unpublishCityGuideEvent",
  description:
    "Unpublish a city guide event, hiding it from everyone but editors. " +
    "Needs the editorial or content-manager role.",
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
    if (!context.unpublishCityGuideEventLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    try {
      return await context.unpublishCityGuideEventLoader(id, {})
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
