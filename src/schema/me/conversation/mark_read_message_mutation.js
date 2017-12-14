import { GraphQLString, GraphQLNonNull } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { DeliveryType } from "./delivery"

export default mutationWithClientMutationId({
  name: "MarkReadMessageMutation",
  description: "Marking a message as read",
  inputFields: {
    conversationId: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The id of the conversation to be updated",
    },
    deliveryId: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The delivery object that is marked as read",
    },
  },
  outputFields: {
    delivery: {
      type: DeliveryType,
      resolve: delivery => delivery,
    },
  },
  mutateAndGetPayload: ({ conversationId, deliveryId }, request, { rootValue: { markMessageReadLoader } }) => {
    if (!markMessageReadLoader) return null
    return markMessageReadLoader({
      conversation_id: conversationId,
      delivery_id: deliveryId,
    })
  },
})
