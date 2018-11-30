import {
  graphql,
  GraphQLInputObjectType,
  GraphQLNonNull,
  GraphQLString,
} from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { OrderOrFailureUnionType } from "./types/order_or_error_union"
import { SellerOrderFields } from "./query_helpers"
import gql from "lib/gql"
import { extractEcommerceResponse } from "./extractEcommerceResponse"
import { CancelReasonTypeEnum } from "./types/cancel_reason_type_enum"

const SellerRejectOfferMutationInputType = new GraphQLInputObjectType({
  name: "OfferMutationInput",
  fields: {
    offerId: {
      type: new GraphQLNonNull(GraphQLString),
      description: "Offer ID",
    },
    rejectReason: {
      type: CancelReasonTypeEnum,
      description: "Reason for rejecting offer",
    },
  },
})

export const SellerRejectOfferMutation = mutationWithClientMutationId({
  name: "sellerRejectOffer",
  description: "Rejects an offer",
  inputFields: SellerRejectOfferMutationInputType.getFields(),
  outputFields: {
    orderOrError: {
      type: OrderOrFailureUnionType,
    },
  },
  mutateAndGetPayload: (
    { offerId, rejectReason },
    context,
    { rootValue: { accessToken, exchangeSchema } }
  ) => {
    if (!accessToken) {
      return new Error("You need to be signed in to perform this action")
    }
    const mutation = gql`
      mutation sellerRejectOffer($offerId: ID!, $rejectReason: EcommerceCancelReasonTypeEnum!) {
        ecommerceSellerRejectOffer(input: {
          offerId: $offerId,
          rejectReason: $rejectReason,
        }) {
          orderOrError {
            __typename
            ... on EcommerceOrderWithMutationSuccess {
              order {
                ${SellerOrderFields}
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
      rejectReason,
    }).then(extractEcommerceResponse("ecommerceSellerRejectOffer"))
  },
})
