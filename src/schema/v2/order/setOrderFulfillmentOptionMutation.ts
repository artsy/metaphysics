import {
  GraphQLNonNull,
  GraphQLInputObjectType,
  GraphQLID,
  GraphQLEnumType,
} from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { ResolverContext } from "types/graphql"
import {
  OrderMutationResponseType,
  ORDER_MUTATION_FLAGS,
} from "./sharedTypes/sharedOrderTypes"
import { handleExchangeError } from "./exchangeErrorHandling"

interface Input {
  id: string
  type?: string
}

// Similar to `FulfillmentOptionTypeEnum` but for input: Expects an all-caps
// enum and converts back to exchange's lower-cased enum for the API.
// Does not permit the SHIPPING_TBD placeholder option (but maybe should allow null?)
const FulfillmentOptionTypeInputEnum = new GraphQLEnumType({
  name: "FulfillmentOptionInputEnum",
  values: {
    DOMESTIC_FLAT: { value: "DOMESTIC_FLAT" },
    INTERNATIONAL_FLAT: { value: "INTERNATIONAL_FLAT" },
    PICKUP: { value: "PICKUP" },
  },
})

const FulfillmentOptionInputType = new GraphQLInputObjectType({
  name: "FulfillmentOptionInput",
  fields: {
    // TODO: Maybe allow null to unset the selected option
    type: { type: new GraphQLNonNull(FulfillmentOptionTypeInputEnum) },
  },
})

export const setOrderFulfillmentOptionMutation = mutationWithClientMutationId<
  Input,
  any,
  ResolverContext
>({
  name: "setOrderFulfillmentOption",
  description: "Set fulfillment option on an order",
  inputFields: {
    id: { type: new GraphQLNonNull(GraphQLID), description: "Order id." },
    fulfillmentOption: {
      type: new GraphQLNonNull(FulfillmentOptionInputType),
    },
  },
  outputFields: {
    orderOrError: {
      type: OrderMutationResponseType,
      resolve: (response) => response,
    },
  },

  mutateAndGetPayload: async (input, context) => {
    const { meOrderSetFulfillmentOptionLoader } = context
    if (!meOrderSetFulfillmentOptionLoader) {
      throw new Error("You need to be signed in to perform this action")
    }
    try {
      const { fulfillmentOption } = input

      const type = fulfillmentOption.type.toLowerCase()

      const payload = {
        type,
      }

      const updatedOrder = await meOrderSetFulfillmentOptionLoader(
        input.id,
        payload
      )

      updatedOrder._type = ORDER_MUTATION_FLAGS.SUCCESS

      return updatedOrder
    } catch (error) {
      return handleExchangeError(error)
    }
  },
})
