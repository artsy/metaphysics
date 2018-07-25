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

const CreateOrderInputType = new GraphQLInputObjectType({
  name: "CreateOrderInput",
  fields: {
    artworkId: {
      type: new GraphQLNonNull(GraphQLString),
      description: "ID of artwork",
    },
    editionSetId: {
      type: GraphQLString,
      description: "ID of artwork's edition set",
    },
    quantity: {
      type: GraphQLInt,
      description: "quantity of artwork",
    },
  },
})

export const CreateOrderWithArtworkMutation = mutationWithClientMutationId({
  name: "CreateOrderWithArtwork",
  description: "Creates an order with an artwork",
  inputFields: CreateOrderInputType.getFields(),
  outputFields: {
    result: {
      type: OrderReturnType,
      resolve: result => result,
    },
  },
  mutateAndGetPayload: (
    { artworkId, editionSetId, quantity },
    context,
    { rootValue: { accessToken, exchangeSchema } }
  ) => {
    if (!accessToken) {
      return new Error("You need to be signed in to perform this action")
    }

    const mutation = `
      mutation createOrderWithArtwork($artworkId: String!, $editionSetId: String, $quantity: Int) {
        ecommerce_createOrderWithArtwork(input: {
          artworkId: $artworkId,
          editionSetId: $editionSetId,
          quantity: $quantity,
        }) {
          order {
            id
            code
            currencyCode
            state
            partnerId
            userId
            fulfillmentType
            shippingAddressLine1
            shippingAddressLine2
            shippingCity
            shippingCountry
            shippingPostalCode
            shippingRegion
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
      artworkId,
      editionSetId,
      quantity,
    }).then(result => {
      console.log(result)
      const { order, errors } = result.data.ecommerce_createOrderWithArtwork
      return {
        order,
        errors,
      }
    })
  },
})
