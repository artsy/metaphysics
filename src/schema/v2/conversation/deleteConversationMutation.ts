import { GraphQLString, GraphQLNonNull } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import Conversation from "schema/v2/conversation"
import { ResolverContext } from "types/graphql"

interface DeleteConversationMutationInputProps {
  id: string
  spam: boolean
}

export default mutationWithClientMutationId<
  DeleteConversationMutationInputProps,
  any,
  ResolverContext
>({
  name: "DeleteConversationMutation",
  description: "Delete a conversation.",
  inputFields: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The id of the conversation to be deleted.",
    },
  },
  outputFields: {
    conversation: {
      type: Conversation.type,
      resolve: (conversation) => conversation,
    },
  },
  mutateAndGetPayload: async (args, { conversationDeleteLoader }) => {
    if (!conversationDeleteLoader) {
      return null
    }

    try {
      const response = await conversationDeleteLoader(args.id)
      return response
    } catch (error) {
      throw new Error(JSON.parse(error.body).error)
    }
  },
})
