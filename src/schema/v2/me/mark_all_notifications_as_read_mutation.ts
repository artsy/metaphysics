import { GraphQLObjectType } from "graphql"
import { GraphQLUnionType } from "graphql"
import { GraphQLBoolean } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import {
  formatGravityError,
  GravityMutationErrorType,
} from "lib/gravityErrorHandler"
import { ResolverContext } from "types/graphql"

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "MarkAllNotificationsAsReadSuccess",
  isTypeOf: (data) => data.success,
  fields: () => ({
    success: {
      type: GraphQLBoolean,
      resolve: (result) => result.success,
    },
  }),
})

const ErrorType = new GraphQLObjectType<any, ResolverContext>({
  name: "MarkAllNotificationsAsReadFailure",
  isTypeOf: (data) => {
    return data._type === "GravityMutationError"
  },
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => (typeof err.message === "object" ? err.message : err),
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "MarkAllNotificationsAsReadResponseOrError",
  types: [SuccessType, ErrorType],
})

export const markAllNotificationsAsReadMutation = mutationWithClientMutationId<
  any,
  any,
  ResolverContext
>({
  name: "MarkAllNotificationsAsRead",
  description: "Mark all unread notifications as read",
  inputFields: {},
  outputFields: {
    responseOrError: {
      type: ResponseOrErrorType,
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (_, { updateNotificationsLoader }) => {
    if (!updateNotificationsLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    try {
      await updateNotificationsLoader({ status: "read" })

      return {
        success: true,
      }
    } catch (error) {
      const formattedErr = formatGravityError(error)

      if (formattedErr) {
        return { ...formattedErr, _type: "GravityMutationError" }
      } else {
        throw new Error(error)
      }
    }
  },
})
