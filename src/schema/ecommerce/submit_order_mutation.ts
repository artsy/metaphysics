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

const SubmitOrderInputType = new GraphQLInputObjectType({
  name: "SubmitOrderInput",
  fields: {
    orderId: {
      type: new GraphQLNonNull(GraphQLString),
      description: "Order ID",
    },
  },
})

export const SubmitOrderMutation = mutationWithClientMutationId<
  any,
  any,
  ResolverContext
>({
  name: "SubmitOrder",
  description: "Submits an order",
  inputFields: SubmitOrderInputType.getFields(),
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
      mutation submitOrder($orderId: ID!) {
        ecommerceSubmitOrder(input: {
          id: $orderId
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
      orderId,
      creditCardId,
    }).then(extractEcommerceResponse("ecommerceSubmitOrder"))
  },
})
