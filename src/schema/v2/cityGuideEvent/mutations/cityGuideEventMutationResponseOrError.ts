import { GraphQLObjectType, GraphQLUnionType } from "graphql"
import { GravityMutationErrorType } from "lib/gravityErrorHandler"
import { ResolverContext } from "types/graphql"
import { CityGuideEventType } from "../cityGuideEvent"

// Shared by all eight city guide event mutations: each one succeeds with a
// whole `CityGuideEvent`, the join mutations included.

export const CityGuideEventMutationSuccessType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "CityGuideEventMutationSuccess",
  isTypeOf: (data) => !!data && data._type !== "GravityMutationError",
  fields: () => ({
    cityGuideEvent: {
      type: CityGuideEventType,
      resolve: (result) => result,
    },
  }),
})

export const CityGuideEventMutationFailureType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "CityGuideEventMutationFailure",
  isTypeOf: (data) => !!data && data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

export const CityGuideEventMutationResponseOrErrorType = new GraphQLUnionType({
  name: "CityGuideEventMutationResponseOrError",
  types: [CityGuideEventMutationSuccessType, CityGuideEventMutationFailureType],
})
