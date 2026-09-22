import { GraphQLObjectType, GraphQLUnionType } from "graphql"
import { GravityMutationErrorType } from "lib/gravityErrorHandler"
import { ResolverContext } from "types/graphql"
import { CityVideoType } from "../cityVideo"

export const CityVideoMutationSuccessType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "CityVideoMutationSuccess",
  isTypeOf: (data) => !!data && data._type !== "GravityMutationError",
  fields: () => ({
    cityVideo: {
      type: CityVideoType,
      resolve: (result) => result,
    },
  }),
})

export const CityVideoMutationFailureType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "CityVideoMutationFailure",
  isTypeOf: (data) => !!data && data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

export const CityVideoMutationResponseOrErrorType = new GraphQLUnionType({
  name: "CityVideoMutationResponseOrError",
  types: [CityVideoMutationSuccessType, CityVideoMutationFailureType],
})
