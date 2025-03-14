import { GraphQLString, GraphQLNonNull, GraphQLID } from "graphql"
import { OrderJSON, OrderType } from "./OrderType"
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

export const editMeOrderMutation = mutationWithClientMutationId<
  Input,
  OrderJSON | null,
  ResolverContext
>({
  name: "editMeOrder",
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
    order: {
      type: OrderType,
      resolve: (response) => response,
    },
  },
  mutateAndGetPayload: async (input, context) => {
    const { meOrderEditLoader } = context
    if (!meOrderEditLoader) {
      throw new Error("You need to be signed in to perform this action")
    }
    const { id, ...updateFields } = input
    const updatedOrder = await meOrderEditLoader(id, updateFields)
    return updatedOrder
  },
})
