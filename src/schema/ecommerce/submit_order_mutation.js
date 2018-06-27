import {
  GraphQLInputObjectType,
  GraphQLNonNull,
  GraphQLString,
  graphql,
} from "graphql"
import { OrderType } from "schema/ecommerce/types/order"
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
  },
})

export const SubmitOrderMutation = mutationWithClientMutationId({
  name: "SubmitOrder",
  decription: "Submitss an order with payment",
  inputFields: SubmitOrderInputType.getFields(),
  outputFields: {
    order: {
      type: OrderType,
      resolve: order => order,
    },
  },
  mutateAndGetPayload: (
    { orderId, creditCardId },
    context,
    { rootValue: { accessToken, exchangeSchema } }
  ) => {
    if (!accessToken) {
      return new Error("You need to be signed in to perform this action")
    }

    const mutation = `
      mutation submitOrder($orderId: ID!, $creditCardId: String!) {
        ecommerce_submitOrder(input: {
          id: $orderId,
          creditCardId: $creditCardId,
        }) {
          order {
           id
            code
            currencyCode
            state
            partnerId
            userId
            updatedAt
            createdAt
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
    }).then(result => result.data.ecommerce_submitOrder.order)
  },
})
