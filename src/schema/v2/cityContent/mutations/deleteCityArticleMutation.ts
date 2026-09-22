import { GraphQLNonNull, GraphQLString } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { formatGravityError } from "lib/gravityErrorHandler"
import { ResolverContext } from "types/graphql"
import { CityArticleMutationResponseOrErrorType } from "./cityArticleMutationResponseOrError"
import { refreshCityArticles } from "../resolveCityArticleJoins"

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
  description:
    "Detach an article from a city. Needs the editorial or " +
    "content_manager role.",
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
    { deleteCityArticleLoader, cityArticlesLoader, articlesLoader }
  ) => {
    if (!deleteCityArticleLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    let join
    try {
      join = await deleteCityArticleLoader(id, {})
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
    const articles = await refreshCityArticles(join.city_slug, {
      cityArticlesLoader,
      articlesLoader,
    })

    return { citySlug: join.city_slug, articles }
  },
})
