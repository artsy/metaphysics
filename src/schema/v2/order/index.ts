import {
  GraphQLEnumType,
  GraphQLFieldConfig,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"
import { ResolverContext } from "types/graphql"
import { InternalIDFields } from "../object_identification"
import { LineItemType } from "./lineItem"
import { FulfillmentOptionType } from "./fulfillmentOption"
import { Money, resolveMinorAndCurrencyFieldsToMoney } from "../fields/money"

const OrderModeEnum = new GraphQLEnumType({
  name: "OrderModeEnum",
  values: {
    BUY: {
      value: "BUY",
    },
    OFFER: {
      value: "OFFER",
    },
  },
})

export const OrderType = new GraphQLObjectType<any, ResolverContext>({
  name: "Order",
  description: "Buyer's representation of an order",
  fields: {
    ...InternalIDFields,
    availableShippingCountries: {
      description:
        "List of alpha-2 country codes to which the order can be shipped",
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(GraphQLString))
      ),
      resolve: ({ available_shipping_countries }) =>
        available_shipping_countries,
    },
    buyerPhoneNumber: {
      type: GraphQLString,
      description: "Phone number of the buyer",
      resolve: ({ buyer_phone_number }) => buyer_phone_number,
    },
    buyerTotal: {
      type: Money,
      description: "The total amount the buyer is expected to pay",
      resolve: (
        { buyer_total_cents: minor, currency_code: currencyCode },
        _args,
        ctx,
        _info
      ) => {
        return resolveMinorAndCurrencyFieldsToMoney(
          { minor, currencyCode },
          _args,
          ctx,
          _info
        )
      },
    },
    fulfillmentOptions: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(FulfillmentOptionType))
      ),
      resolve: ({ fulfillment_options, currency_code }) =>
        fulfillment_options.map((option) => ({
          ...option,
          _currencyCode: currency_code,
        })),
    },
    lineItems: {
      type: new GraphQLList(LineItemType),
      resolve: ({ line_items }) => line_items,
    },
    mode: {
      type: new GraphQLNonNull(OrderModeEnum),
      resolve: ({ mode }) => {
        return mode === "offer" ? "OFFER" : "BUY"
      },
    },
  },
})

export const Order: GraphQLFieldConfig<void, ResolverContext> = {
  args: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
    },
  },
  type: OrderType,
  resolve: async (_root, { id }, { meOrderLoader }) => {
    if (!meOrderLoader) return null
    const order = await meOrderLoader(id)

    return order
  },
}
