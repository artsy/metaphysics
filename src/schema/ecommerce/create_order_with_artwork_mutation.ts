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
import { RequestedFulfillmentFragment } from "./query_helpers"

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
        ecommerce_createOrderWithArtwork(
          input: {
            artworkId: $artworkId
            editionSetId: $editionSetId
            quantity: $quantity
          }
        ) {
          orderOrError {
            ... on EcommerceOrderWithMutationSuccess {
              order {
                id
                buyerTotalCents
                code
                commissionFeeCents
                createdAt
                currencyCode
                itemsTotalCents
                partnerId
                sellerTotalCents
                requestedFulfillment {
                  ${RequestedFulfillmentFragment}
                }
                shippingTotalCents
                state
                stateExpiresAt
                stateUpdatedAt
                taxTotalCents
                transactionFeeCents
                updatedAt
                userId
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

    return (
      graphql(exchangeSchema, mutation, null, context, {
        artworkId,
        editionSetId,
        quantity,
      })
        // Because the error types are represented in the type system we
        // can always assume that data is being used. If the call to Exchange
        // fails then the error would have stopped execution before here
        .then(result => result.data!.ecommerce_createOrderWithArtwork)
    )
  },
})
