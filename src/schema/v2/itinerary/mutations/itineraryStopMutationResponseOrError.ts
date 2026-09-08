import { GraphQLObjectType, GraphQLUnionType } from "graphql"
import { GravityMutationErrorType } from "lib/gravityErrorHandler"
import { ResolverContext } from "types/graphql"
import { ItineraryStopType } from "../itineraryStop"

// Shared success/failure/union types for every mutation whose successful
// payload is a single `ItineraryStop` (create, update, delete-by-id).
// `removeItineraryStopByItem` can affect more than one stop at once, so it
// gets its own plural response type instead of reusing this one.

export const ItineraryStopMutationSuccessType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "ItineraryStopMutationSuccess",
  isTypeOf: (data) => !!data && data._type !== "GravityMutationError",
  fields: () => ({
    itineraryStop: {
      type: ItineraryStopType,
      resolve: (result) => result,
    },
  }),
})

export const ItineraryStopMutationFailureType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "ItineraryStopMutationFailure",
  isTypeOf: (data) => !!data && data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

export const ItineraryStopMutationResponseOrErrorType = new GraphQLUnionType({
  name: "ItineraryStopMutationResponseOrError",
  types: [ItineraryStopMutationSuccessType, ItineraryStopMutationFailureType],
})
