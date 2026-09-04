import {
  GraphQLInt,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
  GraphQLUnionType,
} from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import {
  GravityMutationErrorType,
  formatGravityError,
} from "lib/gravityErrorHandler"
import { ResolverContext } from "types/graphql"
import { meType } from "../index"
import {
  GuidedTourContextEnum,
  GuidedTourEventTypeEnum,
  GuidedTourStateType,
} from "./index"

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "RecordGuidedTourEventSuccess",
  isTypeOf: (data) => data._type === "success",
  fields: () => ({
    guidedTour: {
      type: new GraphQLNonNull(GuidedTourStateType),
      resolve: (result) => result.snapshot,
    },
    me: {
      type: new GraphQLNonNull(meType),
      resolve: (_root, _args, { meLoader }) => meLoader?.(),
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "RecordGuidedTourEventFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: new GraphQLNonNull(GravityMutationErrorType),
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "RecordGuidedTourEventResponseOrError",
  types: [SuccessType, FailureType],
  resolveType: (data) =>
    data._type === "GravityMutationError" ? FailureType.name : SuccessType.name,
})

export const recordGuidedTourEventMutation = mutationWithClientMutationId<
  any,
  any,
  ResolverContext
>({
  name: "RecordGuidedTourEvent",
  description:
    "Record a guided tour event for the logged-in user and return the refreshed state.",
  inputFields: {
    context: { type: new GraphQLNonNull(GuidedTourContextEnum) },
    type: { type: new GraphQLNonNull(GuidedTourEventTypeEnum) },
    tourKey: { type: GraphQLString },
    stepPosition: { type: GraphQLInt },
    itemKey: { type: GraphQLString },
    reason: { type: GraphQLString },
  },
  outputFields: {
    recordGuidedTourEventOrError: {
      type: new GraphQLNonNull(ResponseOrErrorType),
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (input, { recordGuidedTourEventLoader }) => {
    if (!recordGuidedTourEventLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    try {
      const snapshot = await recordGuidedTourEventLoader({
        context: input.context,
        type: input.type,
        tour_key: input.tourKey,
        step_position: input.stepPosition,
        item_key: input.itemKey,
        reason: input.reason,
      })

      return { _type: "success", snapshot }
    } catch (error) {
      const formattedErr = formatGravityError(error)

      if (formattedErr) {
        return { ...formattedErr, _type: "GravityMutationError" }
      }

      return { message: error.message, _type: "GravityMutationError" }
    }
  },
})
