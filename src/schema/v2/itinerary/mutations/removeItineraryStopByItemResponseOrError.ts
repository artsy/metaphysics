import {
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLUnionType,
} from "graphql"
import { GravityMutationErrorType } from "lib/gravityErrorHandler"
import { ResolverContext } from "types/graphql"
import { ItineraryStopType } from "../itineraryStop"

// `removeItineraryStopByItem` can remove more than one stop in a single
// call (Gravity has no uniqueness constraint on section+item, so the same
// item can appear more than once), so its success payload is a list of
// the removed stops rather than the single `itineraryStop` other stop
// mutations return.

export const RemoveItineraryStopByItemSuccessType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "RemoveItineraryStopByItemSuccess",
  isTypeOf: (data) => !!data && data._type !== "GravityMutationError",
  fields: () => ({
    itineraryStops: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(ItineraryStopType))
      ),
      description: "Every stop that was removed",
      resolve: (result) => result,
    },
  }),
})

export const RemoveItineraryStopByItemFailureType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "RemoveItineraryStopByItemFailure",
  isTypeOf: (data) => !!data && data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

export const RemoveItineraryStopByItemResponseOrErrorType = new GraphQLUnionType(
  {
    name: "RemoveItineraryStopByItemResponseOrError",
    types: [
      RemoveItineraryStopByItemSuccessType,
      RemoveItineraryStopByItemFailureType,
    ],
  }
)
