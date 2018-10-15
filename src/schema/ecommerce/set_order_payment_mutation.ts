import {
  graphql,
  GraphQLInputObjectType,
  GraphQLString,
  GraphQLNonNull,
} from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import {
  RequestedFulfillmentFragment,
  BuyerSellerFields,
} from "./query_helpers"
import gql from "lib/gql"
import { OrderOrFailureUnionType } from "./types/order_or_error_union"
import { extractEcommerceResponse } from "./extractEcommerceResponse"

const SetOrderPaymentInputType = new GraphQLInputObjectType({
  name: "SetOrderPaymentInput",
  fields: {
    orderId: {
      type: new GraphQLNonNull(GraphQLString),
      description: "Order ID",
    },
    creditCardId: {
      type: new GraphQLNonNull(GraphQLString),
      description: "Gravity Credit Card Id",
    },
  },
})

export const SetOrderPaymentMutation = mutationWithClientMutationId({
  name: "SetOrderPayment",
  description: "Sets payment information on an order",
  inputFields: SetOrderPaymentInputType.getFields(),
  outputFields: {
    orderOrError: {
      type: OrderOrFailureUnionType,
    },
  },
  mutateAndGetPayload: (
    { orderId, creditCardId },
    context,
    { rootValue: { accessToken, exchangeSchema } }
  ) => {
    if (!accessToken) {
      return new Error("You need to be signed in to perform this action")
    }
    const mutation = gql`
      mutation setOrderPayment($orderId: ID!, $creditCardId: String!) {
        ecommerceSetPayment(input: {
          id: $orderId,
          creditCardId: $creditCardId,
        }) {
          orderOrError {
            __typename
            ... on EcommerceOrderWithMutationSuccess {
              order {
                id
                ${BuyerSellerFields}
                ${RequestedFulfillmentFragment}
                buyerPhoneNumber
                buyerTotalCents
                code
                commissionFeeCents
                commissionRate
                displayCommissionRate
                createdAt
                creditCardId
                currencyCode
                itemsTotalCents
                lastApprovedAt
                lastSubmittedAt
                sellerTotalCents
                shippingTotalCents
                state
                stateExpiresAt
                stateUpdatedAt
                taxTotalCents
                transactionFeeCents
                updatedAt
                lineItems{
                  edges{
                    node{
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
                type
                code
                data
              }
            }
          }
        }
      }
    `
    return graphql(exchangeSchema, mutation, null, context, {
      orderId,
      creditCardId,
    }).then(extractEcommerceResponse("ecommerceSetPayment"))
  },
})
