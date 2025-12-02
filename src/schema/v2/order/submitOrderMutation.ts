import {
  GraphQLString,
  GraphQLNonNull,
  GraphQLID,
  GraphQLBoolean,
} from "graphql"
import {
  ORDER_MUTATION_FLAGS,
  OrderMutationResponseType,
} from "./types/sharedOrderTypes"
import { mutationWithClientMutationId } from "graphql-relay"
import { ResolverContext } from "types/graphql"
import { handleExchangeError } from "./exchangeErrorHandling"
import { getOfferMessage } from "./utils/getOfferMessage"

interface Input {
  id: string
  confirmationToken?: string
  oneTimeUse?: boolean
  offerID?: string
  confirmedSetupIntentId?: string
}

export const submitOrderMutation = mutationWithClientMutationId<
  Input,
  any,
  ResolverContext
>({
  name: "submitOrder",
  description: "Submit an order",
  inputFields: {
    id: { type: new GraphQLNonNull(GraphQLID), description: "Order id." },
    confirmationToken: {
      type: GraphQLString,
      description: "Stripe confirmation token.",
    },
    oneTimeUse: {
      type: GraphQLBoolean,
      description: "Whether the credit card should be one-time use.",
    },
    offerID: {
      type: GraphQLID,
      description: "Offer ID for submitting an offer-order.",
    },
    confirmedSetupIntentId: {
      type: GraphQLString,
      description: "Confirmed setup intent ID for offer orders.",
    },
  },
  outputFields: {
    orderOrError: {
      type: OrderMutationResponseType,
      resolve: (response) => response,
    },
  },
  mutateAndGetPayload: async (input, context) => {
    const { meOrderSubmitLoader, submitArtworkInquiryRequestLoader } = context
    if (!meOrderSubmitLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    try {
      const payload = {
        confirmation_token: input.confirmationToken,
        one_time_use: input.oneTimeUse,
        offer_id: input.offerID,
        confirmed_setup_intent_id: input.confirmedSetupIntentId,
      }
      const submittedOrder = await meOrderSubmitLoader(input.id, payload)

      // If this is an offer order from artwork_page, create an inquiry
      if (
        submittedOrder.mode === "OFFER" &&
        submittedOrder.source === "artwork_page" &&
        submitArtworkInquiryRequestLoader
      ) {
        try {
          const artworkId =
            submittedOrder.line_items?.[0]?.artwork_id ||
            submittedOrder.items?.[0]?.artwork_id

          if (artworkId && submittedOrder.my_last_offer) {
            const {
              note,
              amount_cents,
              currency_code,
            } = submittedOrder.my_last_offer

            const message = getOfferMessage(note, amount_cents, currency_code)

            await submitArtworkInquiryRequestLoader({
              artwork: artworkId,
              message,
              order_id: submittedOrder.id,
            })
          }
        } catch (e) {
          console.error(
            "[submitOrderMutation] Failed to create inquiry for offer order:",
            e
          )
        }
      }

      submittedOrder._type = ORDER_MUTATION_FLAGS.SUCCESS // Set the type for the response
      submittedOrder.__typename = "OrderMutationSuccess"
      return submittedOrder
    } catch (error) {
      return handleExchangeError(error)
    }
  },
})
