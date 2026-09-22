import { GraphQLNonNull, GraphQLString } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { snakeCaseKeys } from "lib/helpers"
import { formatGravityError } from "lib/gravityErrorHandler"
import { ResolverContext } from "types/graphql"
import { CityArticleMutationResponseOrErrorType } from "./cityArticleMutationResponseOrError"

interface InputProps {
  clientMutationId?: string
  citySlug: string
  articleID: string
}

export const createCityArticleMutation = mutationWithClientMutationId<
  InputProps,
  any,
  ResolverContext
>({
  name: "createCityArticle",
  description: "Attach an editorial article to a city, at the end of its list.",
  inputFields: {
    citySlug: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The city slug, e.g. london-united-kingdom.",
    },
    articleID: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The Positron article's id.",
    },
  },
  outputFields: {
    responseOrError: {
      type: CityArticleMutationResponseOrErrorType,
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    { clientMutationId: _clientMutationId, ...attributes },
    { createCityArticleLoader, articlesLoader }
  ) => {
    if (!createCityArticleLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    try {
      const join = await createCityArticleLoader(snakeCaseKeys(attributes))
      const { results } = await articlesLoader({
        ids: [join.article_id],
        limit: 1,
      })
      return { ...join, article: results[0] }
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
