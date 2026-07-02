import { GraphQLNonNull, GraphQLID, GraphQLString } from "graphql"
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
  rejectReason?: string
}

export const rejectSellerOfferMutation = mutationWithClientMutationId<
  Input,
  any,
  ResolverContext
>({
  name: "rejectSellerOffer",
  description: "Decline a seller's offer on an order",
  inputFields: {
    orderID: {
      type: new GraphQLNonNull(GraphQLID),
      description: "Order id.",
    },
    offerID: {
      type: new GraphQLNonNull(GraphQLID),
      description: "Offer id to decline.",
    },
    rejectReason: {
      type: GraphQLString,
      description: "Optional reason for declining the offer.",
    },
  },
  outputFields: {
    orderOrError: {
      type: OrderMutationResponseType,
      resolve: (response) => response,
    },
  },
  mutateAndGetPayload: async (input, context) => {
    const { meOfferRejectLoader } = context
    if (!meOfferRejectLoader) {
      throw new Error("You need to be signed in to perform this action")
    }
    try {
      const { orderID, offerID } = input
      const exchangeInputFields = {
        reject_reason: input.rejectReason,
      }

      const payload = Object.fromEntries(
        Object.entries(exchangeInputFields).filter(
          ([_, value]) => value !== undefined
        )
      )

      const order = await meOfferRejectLoader({ orderID, offerID }, payload)
      order._type = ORDER_MUTATION_FLAGS.SUCCESS // Set the type for the response
      return order
    } catch (error) {
      return handleExchangeError(error)
    }
  },
})
