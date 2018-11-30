import { graphql } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { OrderOrFailureUnionType } from "schema/ecommerce/types/order_or_error_union"
import gql from "lib/gql"
import { BuyerOrderFields } from "./query_helpers"
import { extractEcommerceResponse } from "./extractEcommerceResponse"
import { InitialOfferInputType } from "./types/initial_offer_input_type"
import { moneyFieldToUnit } from "lib/moneyHelper"

export const InitialOfferMutation = mutationWithClientMutationId({
  name: "InitialOffer",
  // @ts-ignore
  deprecationReason: "Use AddInitialOfferToOrder instead.",
  description: "Deprecated.",
  inputFields: InitialOfferInputType.getFields(),
  outputFields: {
    orderOrError: {
      type: OrderOrFailureUnionType,
    },
  },
  mutateAndGetPayload: (
    { offerPrice, orderId },
    context,
    { rootValue: { accessToken, exchangeSchema } }
  ) => {
    if (!accessToken) {
      return new Error("You need to be signed in to perform this action")
    }
    const mutation = gql`
        mutation initialOffer(
          $amountCents: Int!
          $orderId: ID!
        ) {
          ecommerceInitialOffer(
            input: {
              amountCents: $amountCents
              orderId: $orderId
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
    }).then(extractEcommerceResponse("ecommerceInitialOffer"))
  },
})
