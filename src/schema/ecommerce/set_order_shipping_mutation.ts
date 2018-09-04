import {
  GraphQLInputObjectType,
  GraphQLString,
  graphql,
  GraphQLID,
} from "graphql"

import { OrderFulfillmentTypeEnum } from "./types/order_fulfillment_type_enum"
import { mutationWithClientMutationId } from "graphql-relay"
import gql from "lib/gql"
import {
  RequestedFulfillmentFragment,
  BuyerSellerFields,
} from "./query_helpers"
import { OrderOrFailureUnionType } from "./types/order_or_error_union"
import { extractEcommerceResponse } from "./extractEcommerceResponse"

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
    phoneNumber: {
      type: GraphQLString,
      description: "Shipping phone number",
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
    orderOrError: {
      type: OrderOrFailureUnionType,
    },
  },
  mutateAndGetPayload: (
    { orderId, fulfillmentType, shipping, phoneNumber },
    context,
    { rootValue: { accessToken, exchangeSchema } }
  ) => {
    if (!accessToken) {
      return new Error("You need to be signed in to perform this action")
    }

    const mutation = gql`
      mutation setOrderShipping(
        $orderId: ID!
        $fulfillmentType: EcommerceOrderFulfillmentTypeEnum!
        $phoneNumber: String
        $shipping: EcommerceShippingAttributes
      ) {
        ecommerce_setShipping(
          input: {
            id: $orderId
            fulfillmentType: $fulfillmentType
            phoneNumber: $phoneNumber
            shipping: $shipping
          }
        ) {
          orderOrError {
            __typename
            ... on EcommerceOrderWithMutationSuccess {
              order {
                id
                code
                currencyCode
                state
                ${BuyerSellerFields}
                ${RequestedFulfillmentFragment}
                buyerPhoneNumber
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
                lastApprovedAt
                lastSubmittedAt
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
            }
            ... on EcommerceOrderWithMutationFailure {
              error {
                description
              }
            }
          }
        }
      }
    `
    return graphql(exchangeSchema, mutation, null, context, {
      orderId,
      fulfillmentType,
      shipping,
      phoneNumber,
    }).then(extractEcommerceResponse("ecommerce_setShipping"))
  },
})
