import {
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
  GraphQLUnionType,
} from "graphql"
import { GravityMutationErrorType } from "lib/gravityErrorHandler"
import { ResolverContext } from "types/graphql"
import { CityArticleType } from "../cityArticle"

// Returns the city's full, refreshed article list rather than the single
// join row: a single row can't satisfy CityArticleType.article (GraphQLNonNull)
// once Positron drops it (unpublished, or deleted concurrently), and there's
// no "City" GraphQL object here to refetch through.
export const CityArticleMutationSuccessType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "CityArticleMutationSuccess",
  isTypeOf: (data) => !!data && data._type !== "GravityMutationError",
  fields: () => ({
    citySlug: {
      type: new GraphQLNonNull(GraphQLString),
      resolve: ({ citySlug }) => citySlug,
    },
    articles: {
      description: "The city's articles, in their new order.",
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(CityArticleType))
      ),
      resolve: ({ articles }) => articles,
    },
  }),
})

export const CityArticleMutationFailureType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "CityArticleMutationFailure",
  isTypeOf: (data) => !!data && data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

export const CityArticleMutationResponseOrErrorType = new GraphQLUnionType({
  name: "CityArticleMutationResponseOrError",
  types: [CityArticleMutationSuccessType, CityArticleMutationFailureType],
})
