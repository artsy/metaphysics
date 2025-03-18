import {
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLUnionType,
  GraphQLInputObjectType,
  GraphQLID,
  GraphQLEnumType,
} from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { ResolverContext } from "types/graphql"
import { FulfillmentOptionTypeEnum } from "./fulfillmentOption"
import { OrderType, ExchangeErrorType, OrderJSON } from "./OrderType"

const SUCCESS_FLAG = "SuccessType"
const ERROR_FLAG = "ErrorType"

interface Input {
  id: string
  type?: string
}

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "SetOrderFulfillmentOptionSuccess",
  fields: () => ({
    order: {
      type: new GraphQLNonNull(OrderType),
      resolve: (response) => {
        return response
      },
    },
  }),
})

const ErrorType = new GraphQLObjectType<any, ResolverContext>({
  name: "SetOrderFulfillmentOptionError",
  fields: () => ({
    mutationError: {
      type: new GraphQLNonNull(ExchangeErrorType),
      resolve: (err) => (typeof err.message === "object" ? err.message : err),
    },
  }),
})

const ResponseType = new GraphQLUnionType({
  name: "SetOrderFulfillmentOptionResponse",
  types: [SuccessType, ErrorType],
  resolveType: (data) => {
    const result = data._type === ERROR_FLAG ? ErrorType : SuccessType
    return result
  },
})

// Similar to FulfillmentOptionTypeEnum but for input: Expects an all-caps
// enum and converts back to exchange's lower-cased enum for the API
const FulfillmentOptionTypeInputEnum = new GraphQLEnumType({
  name: "FulfillmentOptionInputEnum",
  values: {
    DOMESTIC_FLAT: { value: "DOMESTIC_FLAT" },
    DOMESTIC_EXPEDITED: { value: "DOMESTIC_EXPEDITED" },
    DOMESTIC_PRIORITY: { value: "DOMESTIC_PRIORITY" },
    INTERNATIONAL_STANDARD: { value: "INTERNATIONAL_STANDARD" },
    INTERNATIONAL_EXPEDITED: { value: "INTERNATIONAL_EXPEDITED" },
    PICKUP: { value: "PICKUP" },
    SHIPPING_TBD: { value: "SHIPPING_TBD" },
  },
})

const FulfillmentOptionInputType = new GraphQLInputObjectType({
  name: "FulfillmentOptionInput",
  fields: {
    type: { type: new GraphQLNonNull(FulfillmentOptionTypeInputEnum) },
  },
})

export const setOrderFulfillmentOptionMutation = mutationWithClientMutationId<
  Input,
  OrderJSON | null,
  ResolverContext
>({
  name: "setOrderFulfillmentOption",
  description: "Update an order",
  inputFields: {
    id: { type: new GraphQLNonNull(GraphQLID), description: "Order id." },
    fulfillmentOption: {
      type: new GraphQLNonNull(FulfillmentOptionInputType),
    },
  },
  outputFields: {
    orderOrError: {
      type: ResponseType,
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

      let type: string
      switch (fulfillmentOption.type) {
        case "SHIPPING_TBD":
          throw new Error("can't set placeholder type")
        default:
          type = fulfillmentOption.type.toLowerCase()
      }

      const payload = {
        type,
      }

      const updatedOrder = await meOrderSetFulfillmentOptionLoader(
        input.id,
        payload
      )

      updatedOrder._type = SUCCESS_FLAG

      return updatedOrder
    } catch (error) {
      return {
        message: error.message,
        _type: ERROR_FLAG,
      }
    }
  },
})
