import date from "./fields/date"
import numeral from "numeral"
import { NodeInterface, InternalIDFields } from "./object_identification"
import {
  GraphQLFloat,
  GraphQLNonNull,
  GraphQLString,
  GraphQLObjectType,
  GraphQLEnumType,
  GraphQLBoolean,
} from "graphql"
import { indexOf } from "lodash"
import { connectionWithCursorInfo } from "schema/v2/fields/pagination"
import Image, { normalizeImageData } from "schema/v2/image"
import { ResolverContext } from "types/graphql"

// Taken from https://github.com/RubyMoney/money/blob/master/config/currency_iso.json
import currencyCodes from "lib/currency_codes.json"
const symbolOnly = ["USD", "GBP", "EUR", "MYR"]

export const AuctionResultSorts = {
  type: new GraphQLEnumType({
    name: "AuctionResultSorts",
    values: {
      DATE_DESC: {
        value: "-sale_date",
      },
      PRICE_AND_DATE_DESC: {
        value: "-price_realized_cents_usd,-sale_date",
      },
      ESTIMATE_AND_DATE_DESC: {
        value: "-high_estimate_cents_usd,-sale_date",
      },
    },
  }),
}

const AuctionResultType = new GraphQLObjectType<any, ResolverContext>({
  name: "AuctionResult",
  interfaces: [NodeInterface],
  fields: () => ({
    ...InternalIDFields,
    title: {
      type: GraphQLString,
    },
    artistID: {
      type: new GraphQLNonNull(GraphQLString),
      resolve: ({ artist_id }) => artist_id,
    },
    date,
    dateText: {
      type: GraphQLString,
      resolve: ({ date_text }) => date_text,
    },
    mediumText: {
      type: GraphQLString,
      resolve: ({ medium_text }) => medium_text,
    },
    categoryText: {
      type: GraphQLString,
      resolve: ({ category_text }) => category_text,
    },
    dimensionText: {
      type: GraphQLString,
      resolve: ({ dimension_text }) => dimension_text,
    },
    dimensions: {
      type: new GraphQLObjectType<any, ResolverContext>({
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
      resolve: ({ width_cm, height_cm, depth_cm }) => {
        return {
          width: width_cm,
          height: height_cm,
          depth: depth_cm,
        }
      },
    },
    organization: {
      type: GraphQLString,
    },
    saleDate: date,
    saleDateText: {
      type: GraphQLString,
      resolve: ({ sale_date_text }) => sale_date_text,
    },
    saleTitle: {
      type: GraphQLString,
      resolve: ({ sale_title }) => sale_title,
    },
    currency: {
      type: GraphQLString,
    },
    description: {
      type: GraphQLString,
    },
    externalURL: {
      type: GraphQLString,
      resolve: ({ external_url }) => external_url,
    },
    boughtIn: {
      type: GraphQLBoolean,
      resolve: ({ bought_in }) => bought_in,
    },
    images: {
      type: new GraphQLObjectType<any, ResolverContext>({
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
        if (!images || images.length < 1) {
          return null
        }
        return {
          larger: normalizeImageData(images[0].larger),
          thumbnail: normalizeImageData(images[0].thumbnail),
        }
      },
    },
    estimate: {
      type: new GraphQLObjectType<any, ResolverContext>({
        name: "AuctionLotEstimate",
        fields: {
          low: {
            type: GraphQLFloat,
            resolve: ({ low_estimate_cents }) => low_estimate_cents,
          },
          high: {
            type: GraphQLFloat,
            resolve: ({ high_estimate_cents }) => high_estimate_cents,
          },
          display: {
            type: GraphQLString,
            resolve: ({
              currency,
              low_estimate_cents,
              high_estimate_cents,
            }) => {
              if (!low_estimate_cents && !high_estimate_cents) {
                return null
              }
              const { symbol, subunit_to_unit } = currencyCodes[
                currency.toLowerCase()
              ]
              let display
              let amount
              if (indexOf(symbolOnly, currency) === -1) {
                display = currency
              }

              if (symbol) {
                display = display ? display + " " + symbol : symbol
              }
              if (!low_estimate_cents || !high_estimate_cents) {
                amount = Math.round(
                  (low_estimate_cents || high_estimate_cents) / subunit_to_unit
                )
                display += numeral(amount).format("")
              } else {
                amount = Math.round(low_estimate_cents / subunit_to_unit)
                display += numeral(amount).format("") + " - "
                amount = Math.round(high_estimate_cents / subunit_to_unit)
                display += numeral(amount).format("")
              }

              return display
            },
          },
        },
      }),
      resolve: lot => lot,
    },
    priceRealized: {
      type: new GraphQLObjectType<any, ResolverContext>({
        name: "AuctionResultPriceRealized",
        fields: {
          cents: {
            type: GraphQLFloat,
            resolve: ({ price_realized_cents }) => price_realized_cents,
          },
          centsUSD: {
            type: GraphQLFloat,
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
                display = display ? display + " " + symbol : symbol
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

export const auctionResultConnection = connectionWithCursorInfo({
  nodeType: AuctionResultType,
})
