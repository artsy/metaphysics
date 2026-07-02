import { GraphQLNonNull, GraphQLID } from "graphql"
import {
  ORDER_MUTATION_FLAGS,
  OrderMutationResponseType,
} from "../order/types/sharedOrderTypes"
import { mutationWithClientMutationId } from "graphql-relay"
import { ResolverContext } from "types/graphql"
import { handleExchangeError } from "../order/exchangeErrorHandling"

interface Input {
  orderID: string
  offerID: string
}

export const buyerAcceptOfferMutation = mutationWithClientMutationId<
  Input,
  any,
  ResolverContext
>({
  name: "buyerAcceptOffer",
  description: "Accept a seller's offer on an order",
  inputFields: {
    orderID: {
      type: new GraphQLNonNull(GraphQLID),
      description: "Order id.",
    },
    offerID: {
      type: new GraphQLNonNull(GraphQLID),
      description: "Offer id to accept.",
    },
  },
  outputFields: {
    orderOrError: {
      type: OrderMutationResponseType,
      resolve: (response) => response,
    },
  },
  mutateAndGetPayload: async (input, context) => {
    const { meOfferAcceptLoader } = context
    if (!meOfferAcceptLoader) {
      throw new Error("You need to be signed in to perform this action")
    }
    try {
      const { orderID, offerID } = input
      const order = await meOfferAcceptLoader({ orderID, offerID })
      order._type = ORDER_MUTATION_FLAGS.SUCCESS // Set the type for the response
      return order
    } catch (error) {
      return handleExchangeError(error)
    }
  },
})
