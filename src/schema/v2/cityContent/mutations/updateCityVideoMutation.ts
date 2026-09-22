import { GraphQLInt, GraphQLNonNull, GraphQLString } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { formatGravityError } from "lib/gravityErrorHandler"
import { ResolverContext } from "types/graphql"
import { CityVideoMutationResponseOrErrorType } from "./cityVideoMutationResponseOrError"
import { resolveCityVideoJoins } from "../resolveCityVideoJoins"

interface InputProps {
  clientMutationId?: string
  id: string
  position: number
}

export const updateCityVideoMutation = mutationWithClientMutationId<
  InputProps,
  any,
  ResolverContext
>({
  name: "updateCityVideo",
  description:
    "Move a video within its city's list. Needs the editorial or " +
    "content_manager role.",
  inputFields: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The attachment's id (not the video's).",
    },
    position: {
      type: new GraphQLNonNull(GraphQLInt),
      description:
        "Zero-based position among the city's videos, via acts_as_list's insert_at.",
    },
  },
  outputFields: {
    responseOrError: {
      type: CityVideoMutationResponseOrErrorType,
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    { id, position },
    { updateCityVideoLoader, cityVideosLoader }
  ) => {
    if (!updateCityVideoLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    let join
    try {
      join = await updateCityVideoLoader(id, { position })
    } catch (error) {
      const formattedErr = formatGravityError(error)

      if (formattedErr) {
        return { ...formattedErr, _type: "GravityMutationError" }
      } else {
        throw error
      }
    }

    // The move already succeeded by this point, so a failure refreshing
    // the list surfaces as a plain error rather than a GravityMutationError
    // — it isn't the write that failed.
    const joins = await cityVideosLoader({ city_slug: join.city_slug })

    return { citySlug: join.city_slug, videos: resolveCityVideoJoins(joins) }
  },
})
