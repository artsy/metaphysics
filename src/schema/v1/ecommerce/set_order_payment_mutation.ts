import {
  graphql,
  GraphQLInputObjectType,
  GraphQLString,
  GraphQLNonNull,
} from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { BuyerOrderFields } from "./query_helpers"
import gql from "lib/gql"
import { OrderOrFailureUnionType } from "./types/order_or_error_union"
import { extractEcommerceResponse } from "./extractEcommerceResponse"
import { ResolverContext } from "types/graphql"

const SetOrderPaymentInputType = new GraphQLInputObjectType({
  name: "SetOrderPaymentInput",
  fields: {
    orderId: {
      type: new GraphQLNonNull(GraphQLString),
      description: "Order ID",
    },
    creditCardId: {
      type: new GraphQLNonNull(GraphQLString),
      description: "Gravity Credit Card Id",
    },
  },
})

export const SetOrderPaymentMutation = mutationWithClientMutationId<
  any,
  any,
  ResolverContext
>({
  name: "SetOrderPayment",
  description: "Sets payment information on an order",
  inputFields: SetOrderPaymentInputType.getFields(),
  outputFields: {
    orderOrError: {
      type: OrderOrFailureUnionType,
    },
  },
  mutateAndGetPayload: ({ orderId, creditCardId }, context) => {
    const { accessToken, exchangeSchema } = context
    if (!accessToken) {
      return new Error("You need to be signed in to perform this action")
    }
    const mutation = gql`
      mutation setOrderPayment($orderId: ID!, $creditCardId: String!) {
        ecommerceSetPayment(input: {
          id: $orderId,
          paymentMethod: CREDIT_CARD,
          paymentMethodId: $creditCardId,
        }) {
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
      orderId,
      creditCardId,
    }).then(extractEcommerceResponse("ecommerceSetPayment"))
  },
})
