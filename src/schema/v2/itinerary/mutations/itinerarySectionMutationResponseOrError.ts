import { GraphQLObjectType, GraphQLUnionType } from "graphql"
import { GravityMutationErrorType } from "lib/gravityErrorHandler"
import { ResolverContext } from "types/graphql"
import { ItinerarySectionType } from "../itinerarySection"

// Shared success/failure/union types for every mutation whose successful
// payload is a whole `ItinerarySection` (create, update, delete).

export const ItinerarySectionMutationSuccessType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "ItinerarySectionMutationSuccess",
  isTypeOf: (data) => !!data && data._type !== "GravityMutationError",
  fields: () => ({
    itinerarySection: {
      type: ItinerarySectionType,
      resolve: (result) => result,
    },
  }),
})

export const ItinerarySectionMutationFailureType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "ItinerarySectionMutationFailure",
  isTypeOf: (data) => !!data && data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

export const ItinerarySectionMutationResponseOrErrorType = new GraphQLUnionType(
  {
    name: "ItinerarySectionMutationResponseOrError",
    types: [
      ItinerarySectionMutationSuccessType,
      ItinerarySectionMutationFailureType,
    ],
  }
)
