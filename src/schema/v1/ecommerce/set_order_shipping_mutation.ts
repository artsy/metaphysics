import {
  GraphQLInputObjectType,
  GraphQLString,
  graphql,
  GraphQLID,
} from "graphql"

import { OrderFulfillmentTypeEnum } from "./types/enums/order_fulfillment_type_enum"
import { mutationWithClientMutationId } from "graphql-relay"
import gql from "lib/gql"
import { BuyerOrderFields } from "./query_helpers"
import { OrderOrFailureUnionType } from "./types/order_or_error_union"
import { extractEcommerceResponse } from "./extractEcommerceResponse"
import { ResolverContext } from "types/graphql"

const ShippingInputField = new GraphQLInputObjectType({
  name: "ShippingInputField",
  fields: {
    name: {
      type: GraphQLString,
      description: "Name for the shipping information",
    },
    addressLine1: {
      type: GraphQLString,
      description: "Shipping address line 1",
    },
    addressLine2: {
      type: GraphQLString,
      description: "Shipping address line 2",
    },
    city: {
      type: GraphQLString,
      description: "Shipping city",
    },
    region: {
      type: GraphQLString,
      description: "Shipping region",
    },
    country: {
      type: GraphQLString,
      description: "Shipping country",
    },
    postalCode: {
      type: GraphQLString,
      description: "Shipping postal code",
    },
    phoneNumber: {
      type: GraphQLString,
      description: "Shipping phone number",
    },
  },
})

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
    shipping: {
      type: ShippingInputField,
      description: "Shipping information",
    },
  },
})

export const SetOrderShippingMutation = mutationWithClientMutationId<
  any,
  any,
  ResolverContext
>({
  name: "SetOrderShipping",
  description: "Sets shipping information for an order",
  inputFields: SetOrderShippingInput.getFields(),
  outputFields: {
    orderOrError: {
      type: OrderOrFailureUnionType,
    },
  },
  mutateAndGetPayload: ({ orderId, fulfillmentType, shipping }, context) => {
    const { accessToken, exchangeSchema } = context
    if (!accessToken) {
      return new Error("You need to be signed in to perform this action")
    }

    const mutation = gql`
      mutation setOrderShipping(
        $orderId: ID!
        $fulfillmentType: EcommerceOrderFulfillmentTypeEnum!
        $shipping: EcommerceShippingAttributes
      ) {
        ecommerceSetShipping(
          input: {
            id: $orderId
            fulfillmentType: $fulfillmentType
            shipping: $shipping
          }
        ) {
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
      fulfillmentType,
      shipping,
    }).then(extractEcommerceResponse("ecommerceSetShipping"))
  },
})
