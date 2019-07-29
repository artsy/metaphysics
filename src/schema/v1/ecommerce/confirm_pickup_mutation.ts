import { graphql } from "graphql"
import { OrderMutationInputType } from "schema/v1/ecommerce/types/order_mutation_input"
import { mutationWithClientMutationId } from "graphql-relay"
import { SellerOrderFields } from "./query_helpers"
import gql from "lib/gql"
import { OrderOrFailureUnionType } from "./types/order_or_error_union"
import { extractEcommerceResponse } from "./extractEcommerceResponse"
import { ResolverContext } from "types/graphql"

export const ConfirmPickupMutation = mutationWithClientMutationId<
  any,
  any,
  ResolverContext
>({
  name: "ConfirmPickup",
  description: "Confirms pickup for an ecommerce order",
  inputFields: OrderMutationInputType.getFields(),
  outputFields: {
    orderOrError: {
      type: OrderOrFailureUnionType,
    },
  },
  mutateAndGetPayload: ({ orderId }, context) => {
    const { accessToken, exchangeSchema } = context
    if (!accessToken) {
      return new Error("You need to be signed in to perform this action")
    }
    const mutation = gql`
      mutation confirmPickup($orderId: ID!) {
        ecommerceConfirmPickup(input: {
          id: $orderId,
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
    }).then(extractEcommerceResponse("ecommerceConfirmPickup"))
  },
})
