import {
  GraphQLInputObjectType,
  GraphQLString,
  graphql,
  GraphQLID,
} from "graphql"

import { OrderReturnType } from "schema/ecommerce/types/order_return"
import { OrderFulfillmentTypeEnum } from "./types/order_fulfillment_type_enum"
import { mutationWithClientMutationId } from "graphql-relay"

const SetOrderShippingInput = new GraphQLInputObjectType({
  name: "SetOrderShippingInput",
  fields: {
    orderId: {
      type: GraphQLID,
      description: "Id of the Order",
    },
    fulfillmentType: {
      type: OrderFulfillmentTypeEnum,
      description: "Fulfillment Type of this Order",
    },
    shippingAddressLine1: {
      type: GraphQLString,
      description: "Shipping address line 1",
    },
    shippingAddressLine2: {
      type: GraphQLString,
      description: "Shipping address line 2",
    },
    shippingCity: {
      type: GraphQLString,
      description: "Shipping city",
    },
    shippingRegion: {
      type: GraphQLString,
      description: "Shipping region",
    },
    shippingCountry: {
      type: GraphQLString,
      description: "Shipping country",
    },
    shippingPostalCode: {
      type: GraphQLString,
      description: "Shipping postal code",
    },
  },
})

export const SetOrderShippingMutation = mutationWithClientMutationId({
  name: "SetOrderShipping",
  description: "Sets shipping information for an order",
  inputFields: SetOrderShippingInput.getFields(),
  outputFields: {
    result: {
      type: OrderReturnType,
      resolve: order => order,
    },
  },
  mutateAndGetPayload: (
    {
      orderId,
      fulfillmentType,
      shippingAddressLine1,
      shippingAddressLine2,
      shippingCity,
      shippingRegion,
      shippingCountry,
      shippingPostalCode,
    },
    context,
    { rootValue: { accessToken, exchangeSchema } }
  ) => {
    if (!accessToken) {
      return new Error("You need to be signed in to perform this action")
    }

    const mutation = `
      mutation setOrderShipping($orderId: ID!, $fulfillmentType: EcommerceOrderFulfillmentTypeEnum, $shippingAddressLine1: String, $shippingAddressLine2: String, $shippingCity: String, $shippingRegion: String, $shippingCountry: String, $shippingPostalCode: String) {
        ecommerce_setShipping(input: {
          id: $orderId,
          fulfillmentType: $fulfillmentType,
          shippingAddressLine1: $shippingAddressLine1,
          shippingAddressLine2: $shippingAddressLine2,
          shippingCity: $shippingCity,
          shippingRegion: $shippingRegion,
          shippingCountry: $shippingCountry,
          shippingPostalCode: $shippingPostalCode
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
      orderId,
      fulfillmentType,
      shippingAddressLine1,
      shippingAddressLine2,
      shippingCity,
      shippingRegion,
      shippingCountry,
      shippingPostalCode,
    }).then(result => {
      const { order, errors } = result.data.ecommerce_setShipping
      return {
        order,
        errors,
      }
    })
  },
})
