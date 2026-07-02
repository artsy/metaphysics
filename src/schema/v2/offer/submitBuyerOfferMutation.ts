import { GraphQLNonNull, GraphQLID } from "graphql"
import {
  OFFER_MUTATION_FLAGS,
  OfferMutationResponseType,
} from "../order/types/sharedOfferTypes"
import { mutationWithClientMutationId } from "graphql-relay"
import { ResolverContext } from "types/graphql"
import { handleOfferExchangeError } from "./offerErrorHandling"

interface Input {
  orderID: string
  offerID: string
}

export const submitBuyerOfferMutation = mutationWithClientMutationId<
  Input,
  any,
  ResolverContext
>({
  name: "submitBuyerOffer",
  description: "Submit a pending buyer offer",
  inputFields: {
    orderID: {
      type: new GraphQLNonNull(GraphQLID),
      description: "Order id.",
    },
    offerID: {
      type: new GraphQLNonNull(GraphQLID),
      description: "Offer id to submit.",
    },
  },
  outputFields: {
    offerOrError: {
      type: OfferMutationResponseType,
      resolve: (response) => response,
    },
  },
  mutateAndGetPayload: async (input, context) => {
    const { meOfferSubmitLoader } = context
    if (!meOfferSubmitLoader) {
      throw new Error("You need to be signed in to perform this action")
    }
    try {
      const { orderID, offerID } = input
      const offer = await meOfferSubmitLoader({ orderID, offerID })
      offer._type = OFFER_MUTATION_FLAGS.SUCCESS // Set the type for the response
      return offer
    } catch (error) {
      return handleOfferExchangeError(error)
    }
  },
})
