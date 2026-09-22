import { GraphQLNonNull, GraphQLString } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { snakeCaseKeys } from "lib/helpers"
import { formatGravityError } from "lib/gravityErrorHandler"
import { ResolverContext } from "types/graphql"
import { CityArticleMutationResponseOrErrorType } from "./cityArticleMutationResponseOrError"
import { refreshCityArticles } from "../resolveCityArticleJoins"

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
  description:
    "Attach an editorial article to a city, at the end of its list. " +
    "Needs the editorial or content_manager role.",
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
    { createCityArticleLoader, cityArticlesLoader, articlesLoader }
  ) => {
    if (!createCityArticleLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    let join
    try {
      join = await createCityArticleLoader(snakeCaseKeys(attributes))
    } catch (error) {
      const formattedErr = formatGravityError(error)

      if (formattedErr) {
        return { ...formattedErr, _type: "GravityMutationError" }
      } else {
        throw error
      }
    }

    // The attach already succeeded by this point, so a failure refreshing
    // the list surfaces as a plain error rather than a GravityMutationError
    // — it isn't the write that failed.
    const articles = await refreshCityArticles(join.city_slug, {
      cityArticlesLoader,
      articlesLoader,
    })

    return { citySlug: join.city_slug, articles }
  },
})
