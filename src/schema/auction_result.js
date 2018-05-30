import date from "./fields/date"
import numeral from "numeral"
import { IDFields, NodeInterface } from "./object_identification"
import {
  GraphQLFloat,
  GraphQLInt,
  GraphQLNonNull,
  GraphQLString,
  GraphQLObjectType,
  GraphQLEnumType,
} from "graphql"
import { connectionDefinitions } from "graphql-relay"
import { indexOf } from "lodash"
import Image from "schema/image"

// Taken from https://github.com/RubyMoney/money/blob/master/config/currency_iso.json
const currencyCodes = require("../lib/currency_codes.json")

const symbolOnly = ["USD", "GBP", "EUR", "MYR"]

export const AuctionResultSorts = {
  type: new GraphQLEnumType({
    name: "AuctionResultSorts",
    values: {
      PRICE_AND_DATE_DESC: {
        value: "-price_realized_cents_usd,-sale_date",
      },
    },
  }),
}

const AuctionResultType = new GraphQLObjectType({
  name: "AuctionResult",
  interfaces: [NodeInterface],
  fields: () => ({
    ...IDFields,
    title: {
      type: GraphQLString,
    },
    artist_id: {
      type: new GraphQLNonNull(GraphQLString),
    },
    date,
    date_text: {
      type: GraphQLString,
    },
    medium_text: {
      type: GraphQLString,
    },
    category_text: {
      type: GraphQLString,
    },
    dimension_text: {
      type: GraphQLString,
    },
    dimensions: {
      type: new GraphQLObjectType({
        name: "AuctionLotDimensions",
        description: "In centimeters.",
        fields: {
          width: {
            type: GraphQLFloat,
          },
          height: {
            type: GraphQLFloat,
          },
          depth: {
            type: GraphQLFloat,
          },
        },
      }),
      resolve: ({ width_cm, height_cm, depth_cm }) => ({
        width: width_cm,
        height: height_cm,
        depth: depth_cm,
      }),
    },
    organization: {
      type: GraphQLString,
    },
    sale_date: date,
    sale_date_text: {
      type: GraphQLString,
    },
    sale_title: {
      type: GraphQLString,
    },
    currency: {
      type: GraphQLString,
    },
    description: {
      type: GraphQLString,
    },
    external_url: {
      type: GraphQLString,
    },
    images: {
      type: new GraphQLObjectType({
        name: "AuctionLotImages",
        fields: {
          larger: {
            type: Image.type,
          },
          thumbnail: {
            type: Image.type,
          },
        },
      }),
      resolve: ({ images }) => {
        if (images.length < 1) {
          return null
        }
        return {
          larger: Image.resolve(images[0].larger),
          thumbnail: Image.resolve(images[0].thumbnail),
        }
      },
    },

    price_realized: {
      type: new GraphQLObjectType({
        name: "AuctionResultPriceRealized",
        fields: {
          cents: {
            type: GraphQLInt,
            resolve: ({ price_realized_cents }) => price_realized_cents,
          },
          cents_usd: {
            type: GraphQLInt,
            resolve: ({ price_realized_cents_usd }) => price_realized_cents_usd,
          },
          display: {
            type: GraphQLString,
            args: {
              format: {
                type: GraphQLString,
                description: "Passes in to numeral, such as `'0.00'`",
                defaultValue: "",
              },
            },
            resolve: ({ currency, price_realized_cents }, { format }) => {
              const { symbol, subunit_to_unit } = currencyCodes[
                currency.toLowerCase()
              ]
              let display

              if (indexOf(symbolOnly, currency) === -1) {
                display = currency
              }

              if (symbol) {
                display = display ? `${display} ${symbol}` : symbol
              }

              const amount = Math.round(price_realized_cents / subunit_to_unit)

              display += numeral(amount).format(format)

              return display
            },
          },
        },
      }),
      resolve: lot => lot,
    },
  }),
})

export const auctionResultConnection = connectionDefinitions({
  nodeType: AuctionResultType,
}).connectionType
