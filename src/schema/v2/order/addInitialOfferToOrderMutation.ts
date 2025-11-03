import { GraphQLNonNull, GraphQLID, GraphQLString } from "graphql"
import {
  ORDER_MUTATION_FLAGS,
  OrderMutationResponseType,
} from "./types/sharedOrderTypes"
import { mutationWithClientMutationId } from "graphql-relay"
import { ResolverContext } from "types/graphql"
import { handleExchangeError } from "./exchangeErrorHandling"
import { MoneyInput } from "schema/v2/fields/money"

interface Input {
  orderId: string
  offerPrice: {
    amount: number
    currencyCode: string
  }
  note?: string
}

export const addInitialOfferToOrderMutation = mutationWithClientMutationId<
  Input,
  any,
  ResolverContext
>({
  name: "addInitialOfferToOrder",
  description: "Add an initial offer to an order",
  inputFields: {
    orderId: {
      type: new GraphQLNonNull(GraphQLID),
      description: "Order id.",
    },
    offerPrice: {
      type: new GraphQLNonNull(MoneyInput),
      description: "Offer price.",
    },
    note: {
      type: GraphQLString,
      description: "Optional note for the offer.",
    },
  },
  outputFields: {
    orderOrError: {
      type: OrderMutationResponseType,
      resolve: (response) => response,
    },
  },
  mutateAndGetPayload: async (input, context) => {
    const { meOrderAddInitialOfferLoader } = context
    if (!meOrderAddInitialOfferLoader) {
      throw new Error("You need to be signed in to perform this action")
    }
    try {
      // Convert MoneyInput to amount_cents for exchange API
      const factor = 100 // Default to cents, could look up from currency codes if needed
      const amountCents = Math.round(input.offerPrice.amount * factor)

      const exchangeInputFields = {
        amount_cents: amountCents,
        note: input.note,
      }

      // Filter out `undefined` values from the input fields
      const payload = Object.fromEntries(
        Object.entries(exchangeInputFields).filter(
          ([_, value]) => value !== undefined
        )
      )

      const updatedOrder = await meOrderAddInitialOfferLoader(
        input.orderId,
        payload
      )
      updatedOrder._type = ORDER_MUTATION_FLAGS.SUCCESS // Set the type for the response
      return updatedOrder
    } catch (error) {
      return handleExchangeError(error)
    }
  },
})
