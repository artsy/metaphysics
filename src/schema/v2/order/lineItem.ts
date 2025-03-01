import {
  GraphQLID,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"
import { ResolverContext } from "types/graphql"
import { ArtworkType } from "../artwork"
import { GlobalIDField } from "../object_identification"
import { resolveShippingRates, ShippingRateType } from "./shippingRates"
import { toGlobalId } from "graphql-relay"

export const LineItemType = new GraphQLObjectType<any, ResolverContext>({
  name: "LineItem",
  description: "A line item in an order",
  fields: {
    id: {
      ...GlobalIDField,
      resolve: ({ lineItem }, _args, _request, info) => {
        return (
          (lineItem._id && toGlobalId(info.parentType.name, lineItem._id)) ||
          (lineItem.id && toGlobalId(info.parentType.name, lineItem.id))
        )
      },
    },

    internalID: {
      description: "A type-specific ID likely used as a database ID.",
      type: new GraphQLNonNull(GraphQLID),
      resolve: ({ lineItem: { id } }) => id,
    },

    shippingCountry: {
      type: GraphQLString,
      resolve: ({ lineItem: { shipping_country } }) => shipping_country,
    },

    shippingRates: {
      type: new GraphQLList(ShippingRateType),
      resolve: async ({ lineItem, order }, _args, { artworkLoader }) => {
        const { artwork_id } = lineItem
        const artwork = await artworkLoader(artwork_id)
        const rates = resolveShippingRates({ lineItem, artwork, order })
        console.log(rates.map((rate) => rate.amount))
        return rates
      },
    },

    artwork: {
      type: ArtworkType,
      resolve: ({ lineItem: { artwork_id } }, _args, { artworkLoader }) => {
        return artworkLoader(artwork_id)
      },
    },
  },
})
