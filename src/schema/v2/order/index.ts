import {
  GraphQLFieldConfig,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"
import { ResolverContext } from "types/graphql"
import { InternalIDFields } from "../object_identification"
import { ShippingRateType } from "./shippingRates"
import { LineItemType } from "./lineItem"

export const OrderType = new GraphQLObjectType<any, ResolverContext>({
  name: "Order",
  description: "Buyer's representation of an order",
  fields: {
    ...InternalIDFields,
    buyerPhoneNumber: {
      type: GraphQLString,
      description: "Phone number of the buyer",
      resolve: ({ buyer_phone_number }) => buyer_phone_number,
    },
    lineItems: {
      type: new GraphQLList(LineItemType),
      resolve: ({ line_items, ...order }) =>
        line_items.map((lineItem) => ({
          lineItem,
          order,
        })),
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
    console.log("order", order)
    // const orderResolver = new OrderResolver(order)
    // console.log("orderResolver", orderResolver)

    return order
  },
}

class OrderResolver {
  private orderJson: OrderJson
  public id: string
  public buyerPhoneNumber?: string

  constructor(orderJson: OrderJson) {
    this.orderJson = orderJson
    this.id = this.orderJson.id
    this.buyerPhoneNumber = this.orderJson.buyer_phone_number
  }
  get lineItems() {
    return this.orderJson.line_items.map((lineItem) => {
      return new LineItemResolver(lineItem)
    })
  }
}

class LineItemResolver {
  private lineItemJson: OrderJson["line_items"][0]
  public id: string

  constructor(lineItemJson: OrderJson["line_items"][0]) {
    this.lineItemJson = lineItemJson
    this.id = this.lineItemJson.id
    this.shippingCountry = this.lineItemJson.shipping_country
  }

  get artsyShippingInternational() {
    return this.lineItemJson.artsy_shipping_international
  }

  get internationalShippingFeeCents() {
    return this.lineItemJson.international_shipping_fee_cents
  }

  get shippingCountry() {
    return this.lineItemJson.shipping_country
  }

  get processWithArtsyShippingDomestic() {
    return this.lineItemJson.process_with_artsy_shipping_domestic
  }
}

interface OrderJson {
  id: string
  pickup_available?: boolean
  buyer_phone_number?: string
  line_items: Array<{
    id: string
    // Properties from artwork
    artsy_shipping_international?: boolean
    international_shipping_fee_cents?: number
    shipping_country?: string
    process_with_artsy_shipping_domestic?: boolean
  }>
}
