import { GraphQLObjectType } from "graphql"
import { GraphQLUnionType } from "graphql"
import { GraphQLBoolean } from "graphql"
import { GraphQLNonNull } from "graphql"
import { GraphQLString } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import {
  formatGravityError,
  GravityMutationErrorType,
} from "lib/gravityErrorHandler"
import { ResolverContext } from "types/graphql"

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "MarkNotificationsAsSeenSuccess",
  isTypeOf: (data) => data.success,
  fields: () => ({
    success: {
      type: GraphQLBoolean,
      resolve: (result) => result.success,
    },
  }),
})

const ErrorType = new GraphQLObjectType<any, ResolverContext>({
  name: "MarkNotificationsAsSeenFailure",
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
  name: "MarkNotificationsAsSeenResponseOrError",
  types: [SuccessType, ErrorType],
})

export const markNotificationsAsSeenMutation = mutationWithClientMutationId<
  any,
  any,
  ResolverContext
>({
  name: "MarkNotificationsAsSeen",
  description: "Mark notifications as seen",
  inputFields: {
    until: {
      type: new GraphQLNonNull(GraphQLString),
      description:
        "Until what point of time notifications were seen. ISO8601 standard-formatted string.",
    },
  },
  outputFields: {
    responseOrError: {
      type: ResponseOrErrorType,
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (args, { markNotificationsAsSeenLoader }) => {
    if (!markNotificationsAsSeenLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    try {
      await markNotificationsAsSeenLoader({ seen_at: args.until })

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
