import { GraphQLNonNull, GraphQLID, GraphQLString } from "graphql"
import {
  OFFER_MUTATION_FLAGS,
  OfferMutationResponseType,
} from "../order/types/sharedOfferTypes"
import { mutationWithClientMutationId } from "graphql-relay"
import { ResolverContext } from "types/graphql"
import { handleOfferExchangeError } from "./offerErrorHandling"
import { GraphQLLong } from "lib/customTypes/GraphQLLong"

interface Input {
  orderId: string
  amountMinor: number
  note?: string
}

export const createBuyerOfferMutation = mutationWithClientMutationId<
  Input,
  any,
  ResolverContext
>({
  name: "createBuyerOffer",
  description: "Create a buyer offer on an order",
  inputFields: {
    orderId: {
      type: new GraphQLNonNull(GraphQLID),
      description: "Order id.",
    },
    amountMinor: {
      type: new GraphQLNonNull(GraphQLLong),
      description: "Offer amount in minor units (cents).",
    },
    note: {
      type: GraphQLString,
      description: "Optional note for the offer.",
    },
  },
  outputFields: {
    offerOrError: {
      type: OfferMutationResponseType,
      resolve: (response) => response,
    },
  },
  mutateAndGetPayload: async (input, context) => {
    const { meOfferCreateLoader } = context
    if (!meOfferCreateLoader) {
      throw new Error("You need to be signed in to perform this action")
    }
    try {
      const exchangeInputFields = {
        order_id: input.orderId,
        amount_cents: input.amountMinor,
        note: input.note,
      }

      const payload = Object.fromEntries(
        Object.entries(exchangeInputFields).filter(
          ([_, value]) => value !== undefined
        )
      )

      const offer = await meOfferCreateLoader(null, payload)
      offer._type = OFFER_MUTATION_FLAGS.SUCCESS // Set the type for the response
      return offer
    } catch (error) {
      return handleOfferExchangeError(error)
    }
  },
})
