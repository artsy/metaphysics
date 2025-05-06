import { GraphQLString, GraphQLNonNull, GraphQLID } from "graphql"
import {
  ORDER_MUTATION_FLAGS,
  OrderMutationResponseType,
} from "./sharedTypes/sharedOrderTypes"
import { mutationWithClientMutationId } from "graphql-relay"
import { ResolverContext } from "types/graphql"

interface Input {
  id: string
  confirmationToken?: string
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
      const payload = { confirmation_token: input.confirmationToken }
      const submittedOrder = await meOrderSubmitLoader(input.id, payload)

      submittedOrder._type = ORDER_MUTATION_FLAGS.SUCCESS // Set the type for the response
      return submittedOrder
    } catch (error) {
      return { message: error.message, _type: ORDER_MUTATION_FLAGS.ERROR }
    }
  },
})
