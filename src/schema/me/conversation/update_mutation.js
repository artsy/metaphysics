import { ConversationType, BuyerOutcomeTypes } from "./index"
import { GraphQLList, GraphQLString, GraphQLNonNull } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"

export default mutationWithClientMutationId({
  name: "UpdateConversationMutation",
  description: "Updating buyer outcome of a conversation.",
  inputFields: {
    buyer_outcome: {
      type: new GraphQLNonNull(BuyerOutcomeTypes),
    },
    ids: {
      type: new GraphQLList(GraphQLString),
    },
  },
  outputFields: {
    conversations: {
      type: new GraphQLList(ConversationType),
      resolve: conversations => conversations,
    },
  },
  mutateAndGetPayload: ({ buyer_outcome, ids }, request, { rootValue: { conversationUpdateLoader } }) => {
    if (!conversationUpdateLoader) return null
    return Promise.all(ids.map(id => conversationUpdateLoader(id, { buyer_outcome })))
  },
})
