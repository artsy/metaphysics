import {
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLUnionType,
  GraphQLInputObjectType,
  GraphQLID,
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
  isTypeOf: (value) => {
    // Check for both the standard property and anything we've added
    return Boolean(
      value &&
        (value.__typename === "SetOrderFulfillmentOptionSuccess" ||
          value._type === SUCCESS_FLAG)
    )
  },
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
    console.log("Full data in resolveType:", data)
    if (data.__typename === "SetOrderFulfillmentOptionSuccess") {
      return SuccessType
    }
    if (data.__typename === "SetOrderFulfillmentOptionError") {
      return ErrorType
    }
    const result = data._type === ERROR_FLAG ? ErrorType : SuccessType
    console.log("Resolved to:", result.name)
    return result
  },
})

const FulfillmentOptionInputType = new GraphQLInputObjectType({
  name: "FulfillmentOptionInput",
  fields: {
    type: { type: new GraphQLNonNull(FulfillmentOptionTypeEnum) },
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
      resolve: (response) => {
        console.log(
          "Output resolver received:",
          JSON.stringify(response, null, 2)
        )
        return response
      },
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
      updatedOrder.__typename = "SetOrderFulfillmentOptionSuccess"

      return updatedOrder
    } catch (error) {
      return {
        message: error.message,
        _type: ERROR_FLAG,
        __typename: "SetOrderFulfillmentOptionError",
      }
    }
  },
})
