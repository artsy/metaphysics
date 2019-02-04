import { graphql } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { OrderOrFailureUnionType } from "schema/ecommerce/types/order_or_error_union"
import gql from "lib/gql"
import { BuyerOrderFields } from "./query_helpers"
import { extractEcommerceResponse } from "./extractEcommerceResponse"
import { InitialOfferInputType } from "./types/initial_offer_input_type"
import { moneyFieldToUnit } from "lib/moneyHelper"

export const AddInitialOfferToOrderMutation = mutationWithClientMutationId({
  name: "AddInitialOfferToOrder",
  description: "Adds an offer to a pending order",
  inputFields: InitialOfferInputType.getFields(),
  outputFields: {
    orderOrError: {
      type: OrderOrFailureUnionType,
    },
  },
  mutateAndGetPayload: (
    { offerPrice, orderId, note },
    context,
    { rootValue: { accessToken, exchangeSchema } }
  ) => {
    if (!accessToken) {
      return new Error("You need to be signed in to perform this action")
    }
    const mutation = gql`
      mutation addInitialOfferToOrder(
        $amountCents: Int!
        $orderId: ID!
        $note: String
      ) {
        ecommerceAddInitialOfferToOrder(
          input: {
            amountCents: $amountCents
            orderId: $orderId
            note: $note
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
      amountCents: moneyFieldToUnit(offerPrice),
      orderId,
      note,
    }).then(extractEcommerceResponse("ecommerceAddInitialOfferToOrder"))
  },
})
