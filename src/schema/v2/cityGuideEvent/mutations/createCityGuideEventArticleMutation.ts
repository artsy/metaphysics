import { GraphQLNonNull, GraphQLString } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { snakeCaseKeys } from "lib/helpers"
import { formatGravityError } from "lib/gravityErrorHandler"
import { ResolverContext } from "types/graphql"
import { CityGuideEventMutationResponseOrErrorType } from "./cityGuideEventMutationResponseOrError"

interface InputProps {
  clientMutationId?: string
  cityGuideEventID: string
  articleID: string
}

export const createCityGuideEventArticleMutation = mutationWithClientMutationId<
  InputProps,
  any,
  ResolverContext
>({
  name: "createCityGuideEventArticle",
  description:
    "Attach an editorial article to a city guide event, at the end of " +
    "its list. Returns the event with its articles in their new order.",
  inputFields: {
    cityGuideEventID: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The event's id or slug.",
    },
    articleID: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The Positron article's id.",
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
    if (!context.createCityGuideEventArticleLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    try {
      // Gravity returns only the join row.
      const join = await context.createCityGuideEventArticleLoader(
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
