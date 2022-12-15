import {
  GraphQLString,
  GraphQLNonNull,
  GraphQLBoolean,
  GraphQLObjectType,
  GraphQLUnionType,
} from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import Conversation from "schema/v2/conversation"
import { ResolverContext } from "types/graphql"
import {
  formatGravityError,
  GravityMutationErrorType,
} from "lib/gravityErrorHandler"

interface UpdateMessageMutationInputProps {
  id: string
  spam: boolean
}

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "UpdateMessageSuccess",
  isTypeOf: (data) => data.id,
  fields: () => ({
    conversation: {
      type: Conversation.type,
      resolve: (conversation) => conversation,
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "UpdateMessageFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "UpdateMessageResponseOrError",
  types: [SuccessType, FailureType],
})

export default mutationWithClientMutationId<
  UpdateMessageMutationInputProps,
  any,
  ResolverContext
>({
  name: "UpdateMessageMutation",
  description: "Update a message.",
  inputFields: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The id of the message to be updated.",
    },
    spam: {
      type: new GraphQLNonNull(GraphQLBoolean),
      description: "Mark the message as spam",
    },
  },
  outputFields: {
    conversationOrError: {
      type: ResponseOrErrorType,
      description: "On success: the updated conversation",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async ({ id, spam }, { messageUpdateLoader }) => {
    if (!messageUpdateLoader) {
      return new Error("You need to be signed in to perform this action")
    }

    try {
      const response = await messageUpdateLoader(id, {
        spam,
      })
      return response
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
