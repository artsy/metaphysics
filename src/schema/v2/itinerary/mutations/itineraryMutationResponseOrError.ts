import { GraphQLObjectType, GraphQLUnionType } from "graphql"
import { GravityMutationErrorType } from "lib/gravityErrorHandler"
import { ResolverContext } from "types/graphql"
import { ItineraryType } from "../itinerary"

// Shared success/failure/union types for every mutation whose successful
// payload is a whole `Itinerary` (create, update, delete, publish,
// unpublish, copy) — one definition instead of six near-identical copies.

export const ItineraryMutationSuccessType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "ItineraryMutationSuccess",
  isTypeOf: (data) => !!data && data._type !== "GravityMutationError",
  fields: () => ({
    itinerary: {
      type: ItineraryType,
      resolve: (result) => result,
    },
  }),
})

export const ItineraryMutationFailureType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "ItineraryMutationFailure",
  isTypeOf: (data) => !!data && data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

export const ItineraryMutationResponseOrErrorType = new GraphQLUnionType({
  name: "ItineraryMutationResponseOrError",
  types: [ItineraryMutationSuccessType, ItineraryMutationFailureType],
})
