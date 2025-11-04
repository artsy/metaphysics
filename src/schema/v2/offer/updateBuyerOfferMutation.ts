import { GraphQLNonNull, GraphQLID, GraphQLString } from "graphql"
import {
  OFFER_MUTATION_FLAGS,
  OfferMutationResponseType,
} from "../order/types/sharedOfferTypes"
import { mutationWithClientMutationId } from "graphql-relay"
import { ResolverContext } from "types/graphql"
import { handleOfferExchangeError } from "./offerErrorHandling"
import { MoneyInput } from "../fields/money"

interface Input {
  offerId: string
  offerPrice?: {
    amount: number
    currencyCode: string
  }
  note?: string
}

export const updateBuyerOfferMutation = mutationWithClientMutationId<
  Input,
  any,
  ResolverContext
>({
  name: "updateBuyerOffer",
  description: "Update a buyer offer",
  inputFields: {
    offerId: {
      type: new GraphQLNonNull(GraphQLID),
      description: "Offer id.",
    },
    offerPrice: {
      type: MoneyInput,
      description: "Offer price.",
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
    const { meOfferUpdateLoader } = context
    if (!meOfferUpdateLoader) {
      throw new Error("You need to be signed in to perform this action")
    }
    try {
      const exchangeInputFields: {
        amount_cents?: number
        note?: string
      } = {}

      // Convert MoneyInput to amount_cents for exchange API if provided
      if (input.offerPrice) {
        const factor = 100 // Default to cents, could look up from currency codes if needed
        exchangeInputFields.amount_cents = Math.round(
          input.offerPrice.amount * factor
        )
      }

      if (input.note !== undefined) {
        exchangeInputFields.note = input.note
      }

      const offer = await meOfferUpdateLoader(
        input.offerId,
        exchangeInputFields
      )
      offer._type = OFFER_MUTATION_FLAGS.SUCCESS // Set the type for the response
      return offer
    } catch (error) {
      return handleOfferExchangeError(error)
    }
  },
})
