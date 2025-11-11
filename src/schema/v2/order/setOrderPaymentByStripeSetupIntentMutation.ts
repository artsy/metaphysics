import {
  GraphQLNonNull,
  GraphQLID,
  GraphQLString,
  GraphQLBoolean,
} from "graphql"
import {
  ORDER_MUTATION_FLAGS,
  OrderMutationResponseType,
} from "./types/sharedOrderTypes"
import { mutationWithClientMutationId } from "graphql-relay"
import { ResolverContext } from "types/graphql"
import { handleExchangeError } from "./exchangeErrorHandling"

interface Input {
  id: string
  setupIntentId: string
  oneTimeUse?: boolean
}

export const setOrderPaymentByStripeSetupIntentMutation = mutationWithClientMutationId<
  Input,
  any,
  ResolverContext
>({
  name: "setOrderPaymentByStripeSetupIntent",
  description:
    "Sets payment method on an order using a Stripe setup intent (for ACH/bank payments)",
  inputFields: {
    id: {
      type: new GraphQLNonNull(GraphQLID),
      description: "Order ID.",
    },
    setupIntentId: {
      type: new GraphQLNonNull(GraphQLString),
      description: "Stripe setup intent ID for ACH/bank payments.",
    },
    oneTimeUse: {
      type: GraphQLBoolean,
      description:
        "Whether the payment method should be one-time use. Defaults to false.",
      defaultValue: false,
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
        setup_intent_id: input.setupIntentId,
        setup_intent_one_time_use: input.oneTimeUse ?? false,
      }
      const updatedOrder = await meOrderUpdateLoader(
        input.id,
        exchangeInputFields
      )
      updatedOrder._type = ORDER_MUTATION_FLAGS.SUCCESS // Set the type for the response
      return updatedOrder
    } catch (error) {
      return handleExchangeError(error)
    }
  },
})
