import {
  GraphQLInputObjectType,
  GraphQLNonNull,
  GraphQLString,
  graphql,
} from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { SellerOrderFields } from "./query_helpers"
import gql from "lib/gql"
import { OrderOrFailureUnionType } from "./types/order_or_error_union"
import { extractEcommerceResponse } from "./extractEcommerceResponse"
import { ResolverContext } from "types/graphql"

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

export const FulfillOrderAtOnceMutation = mutationWithClientMutationId<
  any,
  any,
  ResolverContext
>({
  name: "FulfillOrderAtOnce",
  description:
    "Fulfills an Order with one fulfillment by setting this fulfillment to all line items of this order",
  inputFields: FulfillOrderAtOnceInputType.getFields(),
  outputFields: {
    orderOrError: {
      type: OrderOrFailureUnionType,
    },
  },
  mutateAndGetPayload: ({ orderId, fulfillment }, context) => {
    const { accessToken, exchangeSchema } = context
    if (!accessToken) {
      return new Error("You need to be signed in to perform this action")
    }

    const mutation = gql`
      mutation fulfillOrderAtOnce($orderId: ID!, $fulfillment: EcommerceFulfillmentAttributes!) {
        ecommerceFulfillAtOnce(input: {
          id: $orderId,
          fulfillment: $fulfillment
        }) {
          orderOrError {
            __typename
            ... on EcommerceOrderWithMutationSuccess {
              order {
                ${SellerOrderFields}
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
      fulfillment,
    }).then(extractEcommerceResponse("ecommerceFulfillAtOnce"))
  },
})
