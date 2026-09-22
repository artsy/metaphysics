import { GraphQLNonNull, GraphQLString } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { formatGravityError } from "lib/gravityErrorHandler"
import { ResolverContext } from "types/graphql"
import { CityVideoMutationResponseOrErrorType } from "./cityVideoMutationResponseOrError"
import { resolveCityVideoJoins } from "../resolveCityVideoJoins"

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
  description:
    "Detach a video from a city. Needs the editorial or content_manager role.",
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
  mutateAndGetPayload: async (
    { id },
    { deleteCityVideoLoader, cityVideosLoader }
  ) => {
    if (!deleteCityVideoLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    let join
    try {
      join = await deleteCityVideoLoader(id, {})
    } catch (error) {
      const formattedErr = formatGravityError(error)

      if (formattedErr) {
        return { ...formattedErr, _type: "GravityMutationError" }
      } else {
        throw error
      }
    }

    // The detach already succeeded by this point, so a failure refreshing
    // the list surfaces as a plain error rather than a GravityMutationError
    // — it isn't the write that failed.
    const joins = await cityVideosLoader({ city_slug: join.city_slug })

    return { citySlug: join.city_slug, videos: resolveCityVideoJoins(joins) }
  },
})
