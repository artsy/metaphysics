import { graphql } from "graphql"

import { mutationWithClientMutationId } from "graphql-relay"
import { OrderOrFailureUnionType } from "schema/v1/ecommerce/types/order_or_error_union"
import gql from "lib/gql"
import { BuyerOrderFields } from "./query_helpers"
import { extractEcommerceResponse } from "./extractEcommerceResponse"
import { CreateOrderInputType } from "./types/create_order_input_type"
import { ResolverContext } from "types/graphql"

export const CreateOrderWithArtworkMutation = mutationWithClientMutationId<
  any,
  any,
  ResolverContext
>({
  name: "CreateOrderWithArtwork",
  description: "Creates an order with an artwork",
  inputFields: CreateOrderInputType.getFields(),
  outputFields: {
    orderOrError: {
      type: OrderOrFailureUnionType,
    },
  },
  mutateAndGetPayload: ({ artworkId, editionSetId, quantity }, context) => {
    const { accessToken, exchangeSchema } = context
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
                ${BuyerOrderFields}
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
