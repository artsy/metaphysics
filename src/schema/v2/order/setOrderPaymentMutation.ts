import { GraphQLNonNull, GraphQLID, GraphQLString } from "graphql"
import {
  ORDER_MUTATION_FLAGS,
  OrderMutationResponseType,
  OrderPaymentMethodEnum,
  OrderCreditCardWalletTypeEnum,
} from "./types/sharedOrderTypes"
import { mutationWithClientMutationId } from "graphql-relay"
import { ResolverContext } from "types/graphql"
import { handleExchangeError } from "./exchangeErrorHandling"

interface Input {
  id: string
  paymentMethod: string
  paymentMethodId?: string
  creditCardWalletType?: string
  stripeConfirmationToken?: string
}

export const setOrderPaymentMutation = mutationWithClientMutationId<
  Input,
  any,
  ResolverContext
>({
  name: "setOrderPayment",
  description: "Set payment method for an order.",
  inputFields: {
    id: { type: new GraphQLNonNull(GraphQLID), description: "Order id." },
    paymentMethod: {
      type: new GraphQLNonNull(OrderPaymentMethodEnum),
      description: "Payment method.",
    },
    paymentMethodId: {
      type: GraphQLString,
      description: "Saved payment method id (credit card or bank account).",
    },
    creditCardWalletType: {
      type: OrderCreditCardWalletTypeEnum,
      description: "Credit card wallet type (e.g., Apple Pay, Google Pay).",
    },
    stripeConfirmationToken: {
      type: GraphQLString,
      description: "Stripe confirmation token.",
    },
  },
  outputFields: {
    orderOrError: {
      type: OrderMutationResponseType,
      resolve: (response) => response,
    },
  },
  mutateAndGetPayload: async (input, context) => {
    const { meOrderSetPaymentLoader } = context
    if (!meOrderSetPaymentLoader) {
      throw new Error("You need to be signed in to perform this action")
    }
    try {
      const exchangeInputFields = {
        payment_method: input.paymentMethod,
        payment_method_id: input.paymentMethodId,
        credit_card_wallet_type: input.creditCardWalletType,
        stripe_confirmation_token: input.stripeConfirmationToken,
      }

      const payload = Object.fromEntries(
        Object.entries(exchangeInputFields).filter(
          ([_, value]) => value !== undefined
        )
      )
      const updatedOrder = await meOrderSetPaymentLoader(input.id, payload)
      updatedOrder._type = ORDER_MUTATION_FLAGS.SUCCESS
      return updatedOrder
    } catch (error) {
      return handleExchangeError(error)
    }
  },
})
