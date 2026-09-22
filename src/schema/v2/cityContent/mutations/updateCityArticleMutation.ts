import { GraphQLInt, GraphQLNonNull, GraphQLString } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { formatGravityError } from "lib/gravityErrorHandler"
import { ResolverContext } from "types/graphql"
import { CityArticleMutationResponseOrErrorType } from "./cityArticleMutationResponseOrError"
import { refreshCityArticles } from "../resolveCityArticleJoins"

interface InputProps {
  clientMutationId?: string
  id: string
  position: number
}

export const updateCityArticleMutation = mutationWithClientMutationId<
  InputProps,
  any,
  ResolverContext
>({
  name: "updateCityArticle",
  description:
    "Move an article within its city's list. Needs the editorial or " +
    "content_manager role.",
  inputFields: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The attachment's id (not the article's).",
    },
    position: {
      type: new GraphQLNonNull(GraphQLInt),
      description:
        "Zero-based position among the city's articles, via acts_as_list's insert_at.",
    },
  },
  outputFields: {
    responseOrError: {
      type: CityArticleMutationResponseOrErrorType,
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    { id, position },
    { updateCityArticleLoader, cityArticlesLoader, articlesLoader }
  ) => {
    if (!updateCityArticleLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    let join
    try {
      join = await updateCityArticleLoader(id, { position })
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
    const articles = await refreshCityArticles(join.city_slug, {
      cityArticlesLoader,
      articlesLoader,
    })

    return { citySlug: join.city_slug, articles }
  },
})
