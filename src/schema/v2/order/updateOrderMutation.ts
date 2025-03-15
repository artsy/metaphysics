import {
  GraphQLString,
  GraphQLNonNull,
  GraphQLID,
  GraphQLObjectType,
  GraphQLUnionType,
} from "graphql"
import { ExchangeErrorType, OrderJSON, OrderType } from "./OrderType"
import { mutationWithClientMutationId } from "graphql-relay"
import { ResolverContext } from "types/graphql"

const SUCCESS_FLAG = "SuccessType"
const ERROR_FLAG = "ErrorType"

interface Input {
  id: string
  buyerPhoneNumber?: string
  buyerPhoneNumberCountryCode?: string
  shippingName?: string
  shippingAddressLine1?: string
  shippingAddressLine2?: string
  shippingCity?: string
  shippingRegion?: string
  shippingCountry?: string
  shippingPostalCode?: string
}

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "UpdateOrderSuccess",
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
  name: "UpdateOrderError",
  fields: () => ({
    mutationError: {
      type: new GraphQLNonNull(ExchangeErrorType),
      resolve: (err) => (typeof err.message === "object" ? err.message : err),
    },
  }),
})

const ResponseType = new GraphQLUnionType({
  name: "UpdateOrderResponse",
  types: [SuccessType, ErrorType],
  resolveType: (data) => {
    return data._type === ERROR_FLAG ? ErrorType : SuccessType
  },
})

export const updateOrderMutation = mutationWithClientMutationId<
  Input,
  OrderJSON | null,
  ResolverContext
>({
  name: "updateOrder",
  description: "Update an order",
  inputFields: {
    id: { type: new GraphQLNonNull(GraphQLID), description: "Order id." },
    buyerPhoneNumber: {
      type: GraphQLString,
      description: "Buyer's phone number",
    },
    buyerPhoneNumberCountryCode: {
      type: GraphQLString,
      description: "Buyer's phone number country code",
    },
    shippingName: {
      type: GraphQLString,
      description: "Shipping address name",
    },
    shippingAddressLine1: {
      type: GraphQLString,
      description: "Shipping address line 1",
    },
    shippingAddressLine2: {
      type: GraphQLString,
      description: "Shipping address line 2",
    },
    shippingCity: {
      type: GraphQLString,
      description: "Shipping address city",
    },
    shippingRegion: {
      type: GraphQLString,
      description: "Shipping address state/province/region",
    },
    shippingCountry: {
      type: GraphQLString,
      description: "Shipping address country",
    },
    shippingPostalCode: {
      type: GraphQLString,
      description: "Shipping address postal code",
    },
  },
  outputFields: {
    orderOrError: {
      type: ResponseType,
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
        buyer_phone_number: input.buyerPhoneNumber,
        buyer_phone_number_country_code: input.buyerPhoneNumberCountryCode,
        shipping_name: input.shippingName,
        shipping_address_line1: input.shippingAddressLine1,
        shipping_address_line2: input.shippingAddressLine2,
        shipping_city: input.shippingCity,
        shipping_region: input.shippingRegion,
        shipping_country: input.shippingCountry,
        shipping_postal_code: input.shippingPostalCode,
      }
      // filter out `undefined` values from the input fields
      const payload = Object.fromEntries(
        Object.entries(exchangeInputFields).filter(
          ([_, value]) => value !== undefined
        )
      )
      const updatedOrder = await meOrderUpdateLoader(input.id, payload)
      updatedOrder._type = SUCCESS_FLAG // Set the type for the response
      return updatedOrder
    } catch (error) {
      return { message: error.message, _type: ERROR_FLAG }
    }
  },
})
