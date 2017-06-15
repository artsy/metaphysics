import impulse from "lib/loaders/impulse"
import gravity from "lib/loaders/gravity"
import { ConversationType, BuyerOutcomeTypes } from "./conversation"
import { GraphQLList, GraphQLString, GraphQLNonNull } from "graphql"
const { IMPULSE_APPLICATION_ID } = process.env
import { mutationWithClientMutationId } from "graphql-relay"

export default mutationWithClientMutationId({
  name: "UpdateConversation",
  decription: "Updating buyer outcome of a conversation.",
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
  mutateAndGetPayload: ({ buyer_outcome, ids }, request, { rootValue: { accessToken } }) => {
    if (!accessToken) return null
    return gravity
      .with(accessToken, { method: "POST" })("me/token", {
        client_application_id: IMPULSE_APPLICATION_ID,
      })
      .then(data => {
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
