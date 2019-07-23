import { graphql } from "graphql"

import { mutationWithClientMutationId } from "graphql-relay"
import { OrderOrFailureUnionType } from "schema/v2/ecommerce/types/order_or_error_union"
import gql from "lib/gql"
import { BuyerOrderFields } from "./query_helpers"
import { extractEcommerceResponse } from "./extractEcommerceResponse"
import { CreateOfferOrderInputType } from "./types/create_order_input_type"
import { ResolverContext } from "types/graphql"

export const CreateOfferOrderWithArtworkMutation = mutationWithClientMutationId<
  any,
  any,
  ResolverContext
>({
  name: "CreateOfferOrderWithArtwork",
  description: "Creates an order with an artwork",
  inputFields: CreateOfferOrderInputType.getFields(),
  outputFields: {
    orderOrError: {
      type: OrderOrFailureUnionType,
    },
  },
  mutateAndGetPayload: (
    { artworkId, editionSetId, quantity, findActiveOrCreate },
    context
  ) => {
    const { accessToken, exchangeSchema } = context
    if (!accessToken) {
      return new Error("You need to be signed in to perform this action")
    }

    const mutation = gql`
        mutation createOfferOrderWithArtwork(
          $artworkId: String!
          $editionSetId: String
          $quantity: Int
          $findActiveOrCreate: Boolean
        ) {
          ecommerceCreateOfferOrderWithArtwork(
            input: {
              artworkId: $artworkId
              editionSetId: $editionSetId
              quantity: $quantity
              findActiveOrCreate: $findActiveOrCreate
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
      findActiveOrCreate,
    }).then(extractEcommerceResponse("ecommerceCreateOfferOrderWithArtwork"))
  },
})
