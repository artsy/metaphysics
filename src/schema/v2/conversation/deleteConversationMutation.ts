import {
  GraphQLString,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLUnionType,
} from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import {
  formatGravityError,
  GravityMutationErrorType,
} from "lib/gravityErrorHandler"
import Conversation from "schema/v2/conversation"
import { ResolverContext } from "types/graphql"

interface DeleteConversationMutationInputProps {
  id: string
}

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "DeleteConversationSuccess",
  isTypeOf: (data) => data.id,
  fields: () => ({
    conversation: {
      type: Conversation.type,
      resolve: (conversation) => conversation,
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "DeleteConversationFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "DeleteConversationResponseOrError",
  types: [SuccessType, FailureType],
})

export default mutationWithClientMutationId<
  DeleteConversationMutationInputProps,
  any,
  ResolverContext
>({
  name: "DeleteConversationMutation",
  description: "Soft-delete a conversation.",
  inputFields: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The id of the conversation to be deleted.",
    },
  },
  outputFields: {
    conversationOrError: {
      type: ResponseOrErrorType,
      description: "On success: the conversation that was soft deleted.",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (args, { conversationDeleteLoader }) => {
    if (!conversationDeleteLoader) {
      return new Error("You need to be signed in to perform this action")
    }

    try {
      const response = await conversationDeleteLoader(args.id)
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
