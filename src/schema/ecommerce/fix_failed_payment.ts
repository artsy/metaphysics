import { OrderOrFailureUnionType } from "./types/order_or_error_union"
import { mutationWithClientMutationId } from "graphql-relay"
import gql from "lib/gql"
import { BuyerOrderFields } from "./query_helpers"
import {
  graphql,
  GraphQLInputObjectType,
  GraphQLNonNull,
  GraphQLID,
  GraphQLString,
} from "graphql"
import { extractEcommerceResponse } from "./extractEcommerceResponse"
import { ResolverContext } from "types/graphql"

export const FixFailedPaymentInputType = new GraphQLInputObjectType({
  name: "FixFailedPaymentInput",
  fields: {
    offerId: {
      type: new GraphQLNonNull(GraphQLID),
      description: "Offer ID",
    },
    creditCardId: {
      type: new GraphQLNonNull(GraphQLString),
      description: "Credit card ID",
    },
  },
})

export const FixFailedPaymentMutation = mutationWithClientMutationId<
  any,
  any,
  ResolverContext
>({
  name: "FixFailedPayment",
  description: "Fix the failed payment on an offer order",
  inputFields: FixFailedPaymentInputType.getFields(),
  outputFields: {
    orderOrError: {
      type: OrderOrFailureUnionType,
    },
  },
  mutateAndGetPayload: ({ offerId, creditCardId }, context) => {
    const { accessToken, exchangeSchema } = context
    if (!accessToken) {
      return new Error("You need to be signed in to perform this action")
    }
    const mutation = gql`
      mutation fixFailedPayment($offerId: ID!, $creditCardId: String!) {
        ecommerceFixFailedPayment(input: { offerId: $offerId, creditCardId: $creditCardId, }) {
          orderOrError {
            __typename
            ... on EcommerceOrderWithMutationSuccess {
              order {
                ${BuyerOrderFields}
                creditCardId
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
      offerId,
      creditCardId,
    }).then(extractEcommerceResponse("ecommerceFixFailedPayment"))
  },
})
