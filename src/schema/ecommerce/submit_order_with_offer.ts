import {
  GraphQLInputObjectType,
  GraphQLNonNull,
  GraphQLString,
  graphql,
} from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import gql from "lib/gql"
import { BuyerOrderFields } from "./query_helpers"
import { OrderOrFailureUnionType } from "./types/order_or_error_union"
import { extractEcommerceResponse } from "./extractEcommerceResponse"
import { ResolverContext } from "types/graphql"

const SubmitOrderWithOfferInputType = new GraphQLInputObjectType({
  name: "SubmitOrderWithOfferInput",
  fields: {
    offerId: {
      type: new GraphQLNonNull(GraphQLString),
      description: "Offer ID",
    },
  },
})

export const SubmitOrderWithOfferMutation = mutationWithClientMutationId<
  any,
  any,
  ResolverContext
>({
  name: "SubmitOrderWithOffer",
  description: "Submits an order with an offer",
  inputFields: SubmitOrderWithOfferInputType.getFields(),
  outputFields: {
    orderOrError: {
      type: OrderOrFailureUnionType,
    },
  },
  mutateAndGetPayload: ({ offerId }, context) => {
    const { accessToken, exchangeSchema } = context
    if (!accessToken) {
      return new Error("You need to be signed in to perform this action")
    }

    const mutation = gql`
      mutation submitOrder($offerId: ID!) {
        ecommerceSubmitOrderWithOffer(input: {
          offerId: $offerId
        }) {
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
      offerId,
    }).then(extractEcommerceResponse("ecommerceSubmitOrderWithOffer"))
  },
})
