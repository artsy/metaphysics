import { GraphQLNonNull, GraphQLID } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { ResolverContext } from "types/graphql"
import {
  OrderMutationResponseType,
  ORDER_MUTATION_FLAGS,
} from "./types/sharedOrderTypes"
import { handleExchangeError } from "./exchangeErrorHandling"

interface Input {
  id: string
}

export const unsetOrderFulfillmentOptionMutation = mutationWithClientMutationId<
  Input,
  any,
  ResolverContext
>({
  name: "unsetOrderFulfillmentOption",
  description: "Unset fulfillment option on an order",
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
    const { meOrderUnsetFulfillmentOptionLoader } = context
    if (!meOrderUnsetFulfillmentOptionLoader) {
      throw new Error("You need to be signed in to perform this action")
    }
    try {
      const updatedOrder = await meOrderUnsetFulfillmentOptionLoader(input.id)

      updatedOrder._type = ORDER_MUTATION_FLAGS.SUCCESS

      return updatedOrder
    } catch (error) {
      return handleExchangeError(error)
    }
  },
})
