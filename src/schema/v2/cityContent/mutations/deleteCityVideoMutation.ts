import { GraphQLNonNull, GraphQLString } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { formatGravityError } from "lib/gravityErrorHandler"
import { ResolverContext } from "types/graphql"
import { CityVideoMutationResponseOrErrorType } from "./cityVideoMutationResponseOrError"

interface InputProps {
  clientMutationId?: string
  id: string
}

export const deleteCityVideoMutation = mutationWithClientMutationId<
  InputProps,
  any,
  ResolverContext
>({
  name: "deleteCityVideo",
  description: "Detach a video from a city.",
  inputFields: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The attachment's id (not the video's).",
    },
  },
  outputFields: {
    responseOrError: {
      type: CityVideoMutationResponseOrErrorType,
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async ({ id }, { deleteCityVideoLoader }) => {
    if (!deleteCityVideoLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    try {
      return await deleteCityVideoLoader(id, {})
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
