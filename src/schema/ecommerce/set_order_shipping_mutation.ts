import {
  GraphQLInputObjectType,
  GraphQLString,
  graphql,
  GraphQLID,
} from "graphql"

import { OrderReturnType } from "./types/order_return"
import { OrderFulfillmentTypeEnum } from "./types/order_fulfillment_type_enum"
import { mutationWithClientMutationId } from "graphql-relay"
import gql from "lib/gql"
import { RequestedFulfillmentFragment } from "./query_helpers"

const ShippingInputField = new GraphQLInputObjectType({
  name: "ShippingInputField",
  fields: {
    name: {
      type: GraphQLString,
      description: "Name for the shipping information",
    },
    addressLine1: {
      type: GraphQLString,
      description: "Shipping address line 1",
    },
    addressLine2: {
      type: GraphQLString,
      description: "Shipping address line 2",
    },
    city: {
      type: GraphQLString,
      description: "Shipping city",
    },
    region: {
      type: GraphQLString,
      description: "Shipping region",
    },
    country: {
      type: GraphQLString,
      description: "Shipping country",
    },
    postalCode: {
      type: GraphQLString,
      description: "Shipping postal code",
    },
  },
})

const SetOrderShippingInput = new GraphQLInputObjectType({
  name: "SetOrderShippingInput",
  fields: {
    orderId: {
      type: GraphQLID,
      description: "Id of the Order",
    },
    fulfillmentType: {
      type: OrderFulfillmentTypeEnum,
      description: "Fulfillment Type of this Order",
    },
    shipping: {
      type: ShippingInputField,
      description: "Shipping information",
    },
  },
})

export const SetOrderShippingMutation = mutationWithClientMutationId({
  name: "SetOrderShipping",
  description: "Sets shipping information for an order",
  inputFields: SetOrderShippingInput.getFields(),
  outputFields: {
    result: {
      type: OrderReturnType,
      resolve: order => order,
    },
  },
  mutateAndGetPayload: (
    { orderId, fulfillmentType, shipping },
    context,
    { rootValue: { accessToken, exchangeSchema } }
  ) => {
    if (!accessToken) {
      return new Error("You need to be signed in to perform this action")
    }

    const mutation = gql`
      mutation setOrderShipping(
        $orderId: ID!
        $fulfillmentType: EcommerceOrderFulfillmentTypeEnum
        $shipping: EcommerceShippingAttributes
      ) {
        ecommerce_setShipping(
          input: {
            id: $orderId
            fulfillmentType: $fulfillmentType
            shipping: $shipping
          }
        ) {
          order {
            id
            code
            currencyCode
            state
            partnerId
            userId
            requestedFulfillment {
              ${RequestedFulfillmentFragment}
            }
            itemsTotalCents
            shippingTotalCents
            taxTotalCents
            commissionFeeCents
            transactionFeeCents
            buyerTotalCents
            sellerTotalCents
            updatedAt
            createdAt
            stateUpdatedAt
            stateExpiresAt
            lineItems {
              edges {
                node {
                  id
                  priceCents
                  artworkId
                  editionSetId
                  quantity
                }
              }
            }
          }
          errors
        }
      }
    `
    return graphql(exchangeSchema, mutation, null, context, {
      orderId,
      fulfillmentType,
      shipping,
    }).then(result => {
      if (result.errors) {
        throw Error(result.errors.map(d => d.message).join("\n"))
      }
      const { order, errors } = result.data!.ecommerce_setShipping
      return {
        order,
        errors,
      }
    })
  },
})
