import {
  GraphQLInputObjectType,
  GraphQLNonNull,
  GraphQLString,
  GraphQLList,
  GraphQLInt,
  graphql,
} from "graphql"
import { OrderType } from "schema/ecommerce/types/order"
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
    userId: {
      type: new GraphQLNonNull(GraphQLString),
      description: "ID of user submitting the order",
    },
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
  decription: "Creates an order with payment",
  inputFields: CreateOrderInputType.getFields(),
  outputFields: {
    order: {
      type: OrderType,
      resolve: order => order,
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
      mutation creatorder($currencyCode: String!, $partnerId: String!, $userId: String!) {
        ecommerce_createOrder(input: {
          partnerId: $partnerId,
          userId: $userId,
          currencyCode: $currencyCode,
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
      userId,
      partnerId,
      currencyCode,
      lineItems,
    }).then(result => result.data.ecommerce_createOrder.order)
  },
})
