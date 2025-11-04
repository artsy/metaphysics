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
  offerId: string
  amountMinor?: number
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
    amountMinor: {
      type: GraphQLLong,
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
    const { meOfferUpdateLoader } = context
    if (!meOfferUpdateLoader) {
      throw new Error("You need to be signed in to perform this action")
    }
    try {
      const exchangeInputFields: {
        amount_cents?: number
        note?: string
      } = {}

      if (input.amountMinor !== undefined) {
        exchangeInputFields.amount_cents = input.amountMinor
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
