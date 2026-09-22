import { GraphQLObjectType, GraphQLUnionType } from "graphql"
import { GravityMutationErrorType } from "lib/gravityErrorHandler"
import { ResolverContext } from "types/graphql"
import { CityArticleType } from "../cityArticle"

export const CityArticleMutationSuccessType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "CityArticleMutationSuccess",
  isTypeOf: (data) => !!data && data._type !== "GravityMutationError",
  fields: () => ({
    cityArticle: {
      type: CityArticleType,
      resolve: (result) => result,
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
