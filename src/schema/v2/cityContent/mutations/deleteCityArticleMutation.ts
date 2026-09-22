import { GraphQLNonNull, GraphQLString } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { formatGravityError } from "lib/gravityErrorHandler"
import { ResolverContext } from "types/graphql"
import { CityArticleMutationResponseOrErrorType } from "./cityArticleMutationResponseOrError"

interface InputProps {
  clientMutationId?: string
  id: string
}

export const deleteCityArticleMutation = mutationWithClientMutationId<
  InputProps,
  any,
  ResolverContext
>({
  name: "deleteCityArticle",
  description: "Detach an article from a city.",
  inputFields: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The attachment's id (not the article's).",
    },
  },
  outputFields: {
    responseOrError: {
      type: CityArticleMutationResponseOrErrorType,
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    { id },
    { deleteCityArticleLoader, articlesLoader }
  ) => {
    if (!deleteCityArticleLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    try {
      const join = await deleteCityArticleLoader(id, {})
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
