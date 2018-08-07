import {
  GraphQLInputObjectType,
  GraphQLNonNull,
  GraphQLString,
  graphql,
} from "graphql"
import { OrderReturnType } from "schema/ecommerce/types/order_return"
import { mutationWithClientMutationId } from "graphql-relay"

const SubmitOrderInputType = new GraphQLInputObjectType({
  name: "SubmitOrderInput",
  fields: {
    orderId: {
      type: new GraphQLNonNull(GraphQLString),
      description: "Order ID",
    },
  },
})

export const SubmitOrderMutation = mutationWithClientMutationId({
  name: "SubmitOrder",
  description: "Submits an order",
  inputFields: SubmitOrderInputType.getFields(),
  outputFields: {
    result: {
      type: OrderReturnType,
      resolve: result => result,
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

    const mutation = `
      mutation submitOrder($orderId: ID!) {
        ecommerce_submitOrder(input: {
          id: $orderId
        }) {
          order {
           id
            code
            currencyCode
            state
            partnerId
            userId
            fulfillmentType
            shippingAddressLine1
            shippingAddressLine2
            shippingCity
            shippingCountry
            shippingPostalCode
            shippingRegion
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
      const { order, errors } = result.data.ecommerce_submitOrder
      return { order, errors }
    })
  },
})
