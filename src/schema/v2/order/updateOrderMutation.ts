import { GraphQLNonNull, GraphQLID } from "graphql"
import {
  ORDER_MUTATION_FLAGS,
  OrderMutationResponseType,
  OrderPaymentMethodEnum,
  OrderCreditCardWalletTypeEnum,
} from "./sharedTypes/sharedOrderTypes"
import { mutationWithClientMutationId } from "graphql-relay"
import { ResolverContext } from "types/graphql"
import { handleExchangeError } from "./exchangeErrorHandling"

interface Input {
  id: string
  paymentMethod?: string
  creditCardWalletType?: string
}

export const updateOrderMutation = mutationWithClientMutationId<
  Input,
  any,
  ResolverContext
>({
  name: "updateOrder",
  description: "Update an order",
  inputFields: {
    id: { type: new GraphQLNonNull(GraphQLID), description: "Order id." },
    paymentMethod: {
      type: OrderPaymentMethodEnum,
      description: "Payment method.",
    },
    creditCardWalletType: {
      type: OrderCreditCardWalletTypeEnum,
      description: "Credit card wallet type",
    },
  },
  outputFields: {
    orderOrError: {
      type: OrderMutationResponseType,
      resolve: (response) => response,
    },
  },
  mutateAndGetPayload: async (input, context) => {
    const { meOrderUpdateLoader } = context
    if (!meOrderUpdateLoader) {
      throw new Error("You need to be signed in to perform this action")
    }
    try {
      const exchangeInputFields = {
        payment_method: input.paymentMethod,
        credit_card_wallet_type: input.creditCardWalletType,
      }
      // filter out `undefined` values from the input fields
      const payload = Object.fromEntries(
        Object.entries(exchangeInputFields).filter(
          ([_, value]) => value !== undefined
        )
      )
      const updatedOrder = await meOrderUpdateLoader(input.id, payload)
      updatedOrder._type = ORDER_MUTATION_FLAGS.SUCCESS // Set the type for the response
      return updatedOrder
    } catch (error) {
      return handleExchangeError(error)
    }
  },
})
