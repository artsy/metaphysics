import {
  GraphQLInputObjectType,
  GraphQLNonNull,
  GraphQLList,
  GraphQLInt,
  GraphQLString,
  graphql,
} from "graphql"

import { OrderReturnType } from "schema/ecommerce/types/order_return"
import { mutationWithClientMutationId } from "graphql-relay"

const LineItemInputType = new GraphQLInputObjectType({
  name: "LineItemInput",
  fields: {
    artworkId: {
      type: new GraphQLNonNull(GraphQLString),
      description: "ID of artwork",
    },
    quantity: {
      type: new GraphQLNonNull(GraphQLInt),
      description: "quantity of artwork",
    },
    priceCents: {
      type: new GraphQLNonNull(GraphQLInt),
      description: "Price in cents",
    },
  },
})

const CreateOrderInputType = new GraphQLInputObjectType({
  name: "CreateOrderInput",
  fields: {
    partnerId: {
      type: GraphQLString,
      description: "ID of partner representing artwork",
    },
    currencyCode: {
      type: new GraphQLNonNull(GraphQLString),
      description: "Currency code",
    },
    lineItems: {
      type: new GraphQLList(LineItemInputType),
      description: "Line items in the order",
    },
  },
})

export const CreateOrderMutation = mutationWithClientMutationId({
  name: "CreateOrder",
  description: "Creates an order with payment",
  inputFields: CreateOrderInputType.getFields(),
  outputFields: {
    result: {
      type: OrderReturnType,
      resolve: result => result,
    },
  },
  mutateAndGetPayload: (
    { userId, partnerId, currencyCode, lineItems },
    context,
    { rootValue: { accessToken, exchangeSchema } }
  ) => {
    if (!accessToken) {
      return new Error("You need to be signed in to perform this action")
    }

    const mutation = `
      mutation creatorder($currencyCode: String!, $partnerId: String!, $lineItems: [EcommerceLineItemAttributes!]) {
        ecommerce_createOrder(input: {
          partnerId: $partnerId,
          currencyCode: $currencyCode,
          lineItems: $lineItems,
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
            buyerTotalCents
            sellerTotalCents
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
      userId,
      partnerId,
      currencyCode,
      lineItems,
    }).then(result => {
      const { order, errors } = result.data.ecommerce_createOrder
      return {
        order,
        errors,
      }
    })
  },
})
