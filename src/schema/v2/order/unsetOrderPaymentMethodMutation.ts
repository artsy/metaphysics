import { GraphQLID, GraphQLNonNull } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { ResolverContext } from "types/graphql"
import {
  ORDER_MUTATION_FLAGS,
  OrderMutationResponseType,
} from "./types/sharedOrderTypes"
import { handleExchangeError } from "./exchangeErrorHandling"

interface Input {
  id: string
}

export const unsetOrderPaymentMethodMutation = mutationWithClientMutationId<
  Input,
  any,
  ResolverContext
>({
  name: "unsetOrderPaymentMethod",
  description: "Unset payment method and credit card wallet type on an order",
  inputFields: {
    id: { type: new GraphQLNonNull(GraphQLID), description: "Order id." },
  },
  outputFields: {
    orderOrError: {
      type: OrderMutationResponseType,
      resolve: (response) => response,
    },
  },

  mutateAndGetPayload: async (input, context) => {
    const { meOrderUnsetPaymentMethodLoader } = context
    if (!meOrderUnsetPaymentMethodLoader) {
      throw new Error("You need to be signed in to perform this action")
    }
    try {
      const updatedOrder = await meOrderUnsetPaymentMethodLoader(input.id)

      updatedOrder._type = ORDER_MUTATION_FLAGS.SUCCESS

      return updatedOrder
    } catch (error) {
      return handleExchangeError(error)
    }
  },
})
