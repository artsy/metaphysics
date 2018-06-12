import { GraphQLString, GraphQLNonNull } from "graphql"
import { OrderType } from "schema/me/order"
import { mutationWithClientMutationId } from "graphql-relay"

export default mutationWithClientMutationId({
  name: "ConfirmOrderMutation",
  description: "Conforms an order",
  inputFields: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "Order to be updated",
    },
  },
  outputFields: {
    order: {
      type: OrderType,
      resolve: order => order,
    },
  },
  mutateAndGetPayload: (
    { id },
    request,
    { rootValue: { accessToken, confirmOrderLoader } }
  ) => {
    if (!accessToken) {
      return new Error("This action requires a session_id.")
    }

    return confirmOrderLoader(id)
  },
})
