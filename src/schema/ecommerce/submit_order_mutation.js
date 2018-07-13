import {
  GraphQLInputObjectType,
  GraphQLNonNull,
  GraphQLString,
  graphql,
} from "graphql"
import { OrderReturnType } from "schema/ecommerce/types/order_return"
import { mutationWithClientMutationId } from "graphql-relay"

const SubmitOrderInputType = new GraphQLInputObjectType({
  name: "SubmitOrderInput",
  fields: {
    orderId: {
      type: new GraphQLNonNull(GraphQLString),
      description: "Order ID",
    },
    creditCardId: {
      type: new GraphQLNonNull(GraphQLString),
      description: "Credit card ID",
    },
    destinationAccountId: {
      type: new GraphQLNonNull(GraphQLString),
      description: "Partner's merchant account ID"
    },
  },
})

export const SubmitOrderMutation = mutationWithClientMutationId({
  name: "SubmitOrder",
  decription: "Submitss an order with payment",
  inputFields: SubmitOrderInputType.getFields(),
  outputFields: {
    result: {
      type: OrderReturnType,
      resolve: result => result,
    },
  },
  mutateAndGetPayload: (
    { orderId, creditCardId, destinationAccountId },
    context,
    { rootValue: { accessToken, exchangeSchema } }
  ) => {
    if (!accessToken) {
      return new Error("You need to be signed in to perform this action")
    }

    const mutation = `
      mutation submitOrder($orderId: ID!, $creditCardId: String!, $destinationAccountId: String!) {
        ecommerce_submitOrder(input: {
          id: $orderId,
          creditCardId: $creditCardId,
          destinationAccountId: $destinationAccountId,
        }) {
          order {
           id
            code
            currencyCode
            state
            partnerId
            userId
            itemsTotalCents
            shippingTotalCents
            taxTotalCents
            commissionFeeCents
            transactionFeeCents
            subtotalCents
            totalCents
            updatedAt
            createdAt
            stateUpdatedAt
            stateExpiresAt
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
          errors
        }
      }
    `
    return graphql(exchangeSchema, mutation, null, context, {
      orderId,
      creditCardId,
      destinationAccountId,
    }).then(result => {
      const { order, errors } = result.data.ecommerce_submitOrder
      return { order, errors }
    })
  },
})
