import impulse from "lib/loaders/legacy/impulse"
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
  mutateAndGetPayload: ({ buyer_outcome, ids }, request, { rootValue: { impulseTokenLoader } }) => {
    if (!impulseTokenLoader) return null
    return impulseTokenLoader().then(data => {
      return Promise.all(
        ids.map(id =>
          impulse.with(data.token, { method: "PUT" })(`conversations/${id}`, {
            buyer_outcome,
          })
        )
      ).then(conversations => {
        return conversations
      })
    })
  },
})
