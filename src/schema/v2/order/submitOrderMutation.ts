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
import { handleExchangeError } from "./exchangeErrorHandling"

interface Input {
  id: string
  confirmationToken?: string
  oneTimeUse?: boolean
}

export const submitOrderMutation = mutationWithClientMutationId({
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
  },
  outputFields: {
    orderOrError: {
      type: OrderMutationResponseType,
      resolve: (response) => response,
    },
  },
  mutateAndGetPayload: async (input, { meOrderSubmitLoader }) => {
    if (!meOrderSubmitLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    try {
      const payload = {
        confirmation_token: input.confirmationToken,
        one_time_use: input.oneTimeUse,
      }
      const submittedOrder = await meOrderSubmitLoader(input.id, payload)

      submittedOrder._type = ORDER_MUTATION_FLAGS.SUCCESS // Set the type for the response
      submittedOrder.__typename = "OrderMutationSuccess"
      return submittedOrder
    } catch (error) {
      return handleExchangeError(error)
    }
  },
})
