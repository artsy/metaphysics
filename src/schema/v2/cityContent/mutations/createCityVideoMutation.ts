import { GraphQLNonNull, GraphQLString } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { snakeCaseKeys } from "lib/helpers"
import { formatGravityError } from "lib/gravityErrorHandler"
import { ResolverContext } from "types/graphql"
import { CityVideoMutationResponseOrErrorType } from "./cityVideoMutationResponseOrError"

interface InputProps {
  clientMutationId?: string
  citySlug: string
  videoID: string
}

export const createCityVideoMutation = mutationWithClientMutationId<
  InputProps,
  any,
  ResolverContext
>({
  name: "createCityVideo",
  description: "Attach a video to a city, at the end of its list.",
  inputFields: {
    citySlug: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The city slug, e.g. london-united-kingdom.",
    },
    videoID: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The Gravity Video's id.",
    },
  },
  outputFields: {
    responseOrError: {
      type: CityVideoMutationResponseOrErrorType,
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    { clientMutationId: _clientMutationId, ...attributes },
    { createCityVideoLoader }
  ) => {
    if (!createCityVideoLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    try {
      return await createCityVideoLoader(snakeCaseKeys(attributes))
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
