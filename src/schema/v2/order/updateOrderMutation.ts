import { GraphQLString, GraphQLNonNull, GraphQLID } from "graphql"
import {
  ORDER_MUTATION_FLAGS,
  OrderMutationResponseType,
} from "./sharedOrderTypes"
import { mutationWithClientMutationId } from "graphql-relay"
import { ResolverContext } from "types/graphql"

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

export const updateOrderMutation = mutationWithClientMutationId<
  Input,
  any,
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
      updatedOrder._type = ORDER_MUTATION_FLAGS.SUCCESS // Set the type for the response
      return updatedOrder
    } catch (error) {
      return { message: error.message, _type: ORDER_MUTATION_FLAGS.ERROR }
    }
  },
})
