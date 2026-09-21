import {
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLUnionType,
} from "graphql"
import { GravityMutationErrorType } from "lib/gravityErrorHandler"
import { ResolverContext } from "types/graphql"
import { ItineraryStopType } from "../itineraryStop"

// Success/failure/union types for `addItineraryStops`, whose successful
// payload is the list of created `ItineraryStop`s.

export const AddItineraryStopsMutationSuccessType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "AddItineraryStopsMutationSuccess",
  isTypeOf: (data) => !!data && data._type !== "GravityMutationError",
  fields: () => ({
    stops: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(ItineraryStopType))
      ),
      resolve: (result) => result.stops,
    },
  }),
})

export const AddItineraryStopsMutationFailureType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "AddItineraryStopsMutationFailure",
  isTypeOf: (data) => !!data && data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

export const AddItineraryStopsMutationResponseOrErrorType = new GraphQLUnionType(
  {
    name: "AddItineraryStopsMutationResponseOrError",
    types: [
      AddItineraryStopsMutationSuccessType,
      AddItineraryStopsMutationFailureType,
    ],
  }
)
