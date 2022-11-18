import { GraphQLString, GraphQLNonNull, GraphQLBoolean } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import Conversation from "schema/v2/conversation"
import { ResolverContext } from "types/graphql"

interface UpdateMessageMutationInputProps {
  id: string
  spam: boolean
}

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
    conversation: {
      type: Conversation.type,
      resolve: (conversation) => conversation,
    },
  },
  mutateAndGetPayload: async (args, { messageUpdateLoader }) => {
    if (!messageUpdateLoader) {
      return null
    }

    try {
      const response = await messageUpdateLoader(args.id, {
        spam: args.spam,
      })
      return response
    } catch (error) {
      throw new Error(error.body?.error)
    }
  },
})
