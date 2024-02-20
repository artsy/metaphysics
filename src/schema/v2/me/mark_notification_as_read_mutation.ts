import {
  GraphQLObjectType,
  GraphQLUnionType,
  GraphQLBoolean,
  GraphQLNonNull,
  GraphQLString,
} from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import {
  formatGravityError,
  GravityMutationErrorType,
} from "lib/gravityErrorHandler"
import { ResolverContext } from "types/graphql"
import { meType } from "../me"

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "MarkNotificationAsReadSuccess",
  isTypeOf: (data) => data.success,
  fields: () => ({
    me: {
      type: new GraphQLNonNull(meType),
      resolve: (_source, _args, { meLoader }) => {
        return meLoader?.()
      },
    },
    success: {
      type: GraphQLBoolean,
      resolve: (result) => result.success,
    },
  }),
})

const ErrorType = new GraphQLObjectType<any, ResolverContext>({
  name: "MarkNotificationAsReadFailure",
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
  name: "MarkNotificationAsReadResponseOrError",
  types: [SuccessType, ErrorType],
})

export const markNotificationAsReadMutation = mutationWithClientMutationId<
  any,
  any,
  ResolverContext
>({
  name: "MarkNotificationAsRead",
  description: "Mark an unread notifications as read",
  inputFields: {
    id: { type: new GraphQLNonNull(GraphQLString) },
  },
  outputFields: {
    responseOrError: {
      type: ResponseOrErrorType,
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (args, { updateNotificationsLoader }) => {
    if (!updateNotificationsLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    try {
      await updateNotificationsLoader({ ids: [args.id], status: "read" })

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
