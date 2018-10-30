import { graphql } from "graphql"

import { mutationWithClientMutationId } from "graphql-relay"
import { OrderOrFailureUnionType } from "schema/ecommerce/types/order_or_error_union"
import gql from "lib/gql"
import { BuyerFields } from "./query_helpers"
import { extractEcommerceResponse } from "./extractEcommerceResponse"
import { CreateOrderInputType } from "./types/create_order_input_type"

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
                ${BuyerFields}
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
