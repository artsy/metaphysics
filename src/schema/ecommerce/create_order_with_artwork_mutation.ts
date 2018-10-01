import {
  GraphQLInputObjectType,
  GraphQLNonNull,
  GraphQLInt,
  GraphQLString,
  graphql,
} from "graphql"

import { mutationWithClientMutationId } from "graphql-relay"
import { OrderOrFailureUnionType } from "schema/ecommerce/types/order_or_error_union"
import gql from "lib/gql"
import {
  RequestedFulfillmentFragment,
  BuyerSellerFields,
} from "./query_helpers"
import { extractEcommerceResponse } from "./extractEcommerceResponse"

const CreateOrderInputType = new GraphQLInputObjectType({
  name: "CreateOrderInput",
  fields: {
    artworkId: {
      type: new GraphQLNonNull(GraphQLString),
      description: "BSON ID of artwork",
    },
    editionSetId: {
      type: GraphQLString,
      description: "ID of artwork's edition set",
    },
    quantity: {
      type: GraphQLInt,
      description: "quantity of artwork",
    },
  },
})

export const CreateOrderWithArtworkMutation = mutationWithClientMutationId({
  name: "CreateOrderWithArtwork",
  description: "Creates an order with an artwork",
  inputFields: CreateOrderInputType.getFields(),
  outputFields: {
    orderOrError: {
      type: OrderOrFailureUnionType,
    },
  },
  mutateAndGetPayload: (
    { artworkId, editionSetId, quantity },
    context,
    { rootValue: { accessToken, exchangeSchema } }
  ) => {
    if (!accessToken) {
      return new Error("You need to be signed in to perform this action")
    }

    const mutation = gql`
      mutation createOrderWithArtwork(
        $artworkId: String!
        $editionSetId: String
        $quantity: Int
      ) {
        ecommerceCreateOrderWithArtwork(
          input: {
            artworkId: $artworkId
            editionSetId: $editionSetId
            quantity: $quantity
          }
        ) {
          orderOrError {
            __typename
            ... on EcommerceOrderWithMutationSuccess {
              order {
                id
                buyerTotalCents
                buyerPhoneNumber
                code
                commissionFeeCents
                createdAt
                currencyCode
                itemsTotalCents
                ${BuyerSellerFields}
                sellerTotalCents
                ${RequestedFulfillmentFragment}
                shippingTotalCents
                state
                stateReason
                stateExpiresAt
                stateUpdatedAt
                taxTotalCents
                transactionFeeCents
                updatedAt
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
      artworkId,
      editionSetId,
      quantity,
    }).then(extractEcommerceResponse("ecommerceCreateOrderWithArtwork"))
  },
})
