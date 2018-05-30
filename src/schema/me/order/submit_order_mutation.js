import { GraphQLInputObjectType, GraphQLNonNull, GraphQLString } from "graphql"
import { OrderType } from "schema/me/order"
import { mutationWithClientMutationId } from "graphql-relay"

export const SubmitOrderInputType = new GraphQLInputObjectType({
  name: "SubmitOrderInput",
  fields: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "Order to be updated",
    },
    credit_card_token: {
      type: GraphQLString,
      description: "Third party tokenization of card",
    },
    credit_card_id: {
      type: GraphQLString,
      description: "ID of chosen form of payment",
    },
    session_id: {
      type: GraphQLString,
      description: "Session ID necessary if there is no user present",
    },
  },
})

export default mutationWithClientMutationId({
  name: "SubmitOrder",
  description: "Submit an order with payment",
  inputFields: SubmitOrderInputType.getFields(),
  outputFields: {
    order: {
      type: OrderType,
      resolve: order => {return order},
    },
  },
  mutateAndGetPayload: (
    { id, credit_card_token, credit_card_id, session_id },
    request,
    { rootValue: { accessToken, submitOrderLoader } }
  ) => {
    if (!accessToken) {
      if (!session_id) {
        return new Error("This action requires a session_id.")
      }
    }

    return submitOrderLoader(id, {
      id,
      credit_card_token,
      credit_card_id,
      session_id,
    })
  },
})
