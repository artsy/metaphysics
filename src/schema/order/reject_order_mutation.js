import { GraphQLString, GraphQLNonNull } from "graphql"
import { OrderType } from "schema/me/order"
import { mutationWithClientMutationId } from "graphql-relay"

export default mutationWithClientMutationId({
  name: "RejectOrderMutation",
  description: "Rejects an order",
  inputFields: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "Order to be updated",
    },
  },
  outputFields: {
    order: {
      type: OrderType,
      resolve: ({ id }, _, _request, { rootValue: { orderLoader } }) => {
        return orderLoader(id).then(order => order.body)
      },
    },
  },
  mutateAndGetPayload: (
    { id },
    request,
    { rootValue: { accessToken, rejectOrderLoader } }
  ) => {
    if (!accessToken) {
      return new Error("This action requires a session_id.")
    }
    return rejectOrderLoader(id).then(() => ({ id }))
  },
})
