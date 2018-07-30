import {
  GraphQLInputObjectType,
  GraphQLNonNull,
  GraphQLString,
  graphql,
} from "graphql"
import { OrderReturnType } from "schema/ecommerce/types/order_return"
import { mutationWithClientMutationId } from "graphql-relay"

const FulfillmentInputType = new GraphQLInputObjectType({
  name: "FulfillmentInputType",
  fields: {
    courier: {
      type: new GraphQLNonNull(GraphQLString),
      description: "Courier of the fulfiller",
    },
    trackingId: {
      type: GraphQLString,
      description: "Courier's Tracking ID of this fulfillment",
    },
    estimatedDelivery: {
      type: GraphQLString,
      description: "Estimated delivery in YY-MM-DD format",
    },
  },
})

const FulfillOrderAtOnceInputType = new GraphQLInputObjectType({
  name: "FulfillOrderAtOnceInput",
  fields: {
    orderId: {
      type: new GraphQLNonNull(GraphQLString),
      description: "ID of the order",
    },
    fulfillment: {
      type: new GraphQLNonNull(FulfillmentInputType),
      description: "Fulfillment information of this order",
    },
  },
})

export const FulfillOrderAtOnceMutation = mutationWithClientMutationId({
  name: "FulfillOrderAtOnce",
  description:
    "Fulfills an Order with one fulfillment by setting this fulfillment to all line items of this order",
  inputFields: FulfillOrderAtOnceInputType.getFields(),
  outputFields: {
    result: {
      type: OrderReturnType,
      resolve: order => order,
    },
  },
  mutateAndGetPayload: (
    { orderId, fulfillment },
    context,
    { rootValue: { accessToken, exchangeSchema } }
  ) => {
    if (!accessToken) {
      return new Error("You need to be signed in to perform this action")
    }

    const mutation = `
      mutation fulfillOrderAtOnce($orderId: ID!, $fulfillment: FulfillmentAttributes!) {
        ecommerce_fulfillAtOnce(input: {
          id: $orderId,
          fulfillment: $fulfillment
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
                  fulfillments{
                    edges{
                      node{
                        id
                        courier
                        trackingId
                        estimatedDelivery
                      }
                    }
                  }
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
      fulfillment,
    }).then(result => {
      const { order, errors } = result.data.ecommerce_fulfillAtOnce
      return {
        order,
        errors,
      }
    })
  },
})
