import {
  graphql,
  GraphQLInputObjectType,
  GraphQLString,
  GraphQLNonNull,
} from "graphql"
import { OrderReturnType } from "schema/ecommerce/types/order_return"
import { mutationWithClientMutationId } from "graphql-relay"
import {
  RequestedFulfillmentFragment,
  BuyerSellerFields,
} from "./query_helpers"
import gql from "lib/gql"

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
    result: {
      type: OrderReturnType,
      resolve: order => order,
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
        ecommerce_setPayment(input: {
          id: $orderId,
          creditCardId: $creditCardId,
        }) {
          order {
           id
            code
            currencyCode
            state
            ${BuyerSellerFields}
            ${RequestedFulfillmentFragment}
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
          errors
        }
      }
    `
    return graphql(exchangeSchema, mutation, null, context, {
      orderId,
      creditCardId,
    }).then(result => {
      if (result.errors) {
        throw Error(result.errors.map(d => d.message))
      }
      const { order, errors } = result.data.ecommerce_setPayment
      return {
        order,
        errors,
      }
    })
  },
})
