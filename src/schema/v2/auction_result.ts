import * as Sentry from "@sentry/node"
import {
  GraphQLArgumentConfig,
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLFieldConfig,
  GraphQLFloat,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"
import { connectionFromArraySlice } from "graphql-relay"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import {
  isCurrencySupported,
  priceDisplayText,
  priceRangeDisplayText,
} from "lib/moneyHelpers"
import { isNil, merge } from "lodash"
import { pageable } from "relay-cursor-paging"
import {
  connectionWithCursorInfo,
  createPageCursors,
} from "schema/v2/fields/pagination"
import Image, { normalizeImageData } from "schema/v2/image"
import { ResolverContext } from "types/graphql"
import { ArtistType } from "./artist"
import date from "./fields/date"
import { InternalIDFields, NodeInterface } from "./object_identification"
// Taken from https://github.com/RubyMoney/money/blob/master/config/currency_iso.json
import { YearRange } from "./types/yearRange"

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

export const AuctionResultsState: GraphQLArgumentConfig = {
  type: new GraphQLEnumType({
    name: "AuctionResultsState",
    values: {
      ALL: {
        value: "all",
      },
      PAST: {
        value: "past",
      },
      UPCOMING: {
        value: "upcoming",
      },
    },
  }),
  defaultValue: "all",
  description:
    "State of the returned auction results (can be past, upcoming, or all)",
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
    artist: {
      type: ArtistType,
      resolve: ({ artist }) => artist,
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
    comparableAuctionResults: {
      type: auctionResultConnection.connectionType,
      description: "Comparable auction results ",
      args: pageable({}),
      resolve: async (
        parent,
        options,
        { auctionResultComparableAuctionResultsLoader }
      ) => {
        if (!auctionResultComparableAuctionResultsLoader) {
          return null
        }

        const { page, size, offset } = convertConnectionArgsToGravityArgs(
          options
        )

        const {
          _embedded: { items },
          total_count,
        } = await auctionResultComparableAuctionResultsLoader(parent.id)

        return merge(
          {
            pageCursors: createPageCursors(
              {
                page,
                size,
              },
              total_count
            ),
          },
          {
            totalCount: total_count,
          },
          connectionFromArraySlice(items, options, {
            arrayLength: total_count,
            sliceStart: offset,
          })
        )
      },
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
    location: {
      type: GraphQLString,
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
    performance: {
      type: new GraphQLObjectType({
        name: "AuctionLotPerformance",
        fields: {
          mid: {
            type: GraphQLString,
            description: "Percentage performance over mid-estimate",
            resolve: ({
              price_realized_cents,
              high_estimate_cents,
              low_estimate_cents,
            }) => {
              if (
                price_realized_cents &&
                high_estimate_cents &&
                low_estimate_cents
              ) {
                const midEstimate =
                  (low_estimate_cents + high_estimate_cents) / 2
                const delta = price_realized_cents - midEstimate
                return Math.round((delta / midEstimate) * 100) + "%"
              }
              return null
            },
          },
        },
      }),
      resolve: (lot) => lot,
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

              if (!isCurrencySupported(currency)) {
                Sentry.captureException(`currency not supported ${currency}}`)
                return null
              }

              return priceRangeDisplayText(
                low_estimate_cents,
                high_estimate_cents,
                currency,
                ""
              )
            },
          },
        },
      }),
      resolve: (lot) => lot,
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
              if (isNil(price_realized_cents)) {
                return null
              }

              if (!isCurrencySupported(currency)) {
                Sentry.captureException(`currency not supported ${currency}}`)
                return null
              }

              return priceDisplayText(price_realized_cents, currency, format)
            },
          },
          displayUSD: {
            type: GraphQLString,
            args: {
              format: {
                type: GraphQLString,
                description: "Passes in to numeral, such as `'0.00'`",
                defaultValue: "",
              },
            },
            resolve: ({ price_realized_cents_usd }, { format }) => {
              if (isNil(price_realized_cents_usd)) {
                return null
              }

              return priceDisplayText(price_realized_cents_usd, "USD", format)
            },
          },
        },
      }),
      resolve: (lot) => lot,
    },
  }),
})

export const AuctionResult: GraphQLFieldConfig<void, ResolverContext> = {
  type: AuctionResultType,
  description: "An auction result",
  args: {
    id: {
      description: "The ID of the auction result",
      type: new GraphQLNonNull(GraphQLString),
    },
  },
  resolve: (_root, { id }, { auctionLotLoader }) => {
    if (!auctionLotLoader) {
      return null
    }
    return auctionLotLoader(id)
  },
}

export const auctionResultConnection = connectionWithCursorInfo({
  nodeType: AuctionResultType,
  connectionFields: {
    createdYearRange: {
      resolve: ({ artist_id }, _, { auctionCreatedYearRangeLoader }) => {
        return auctionCreatedYearRangeLoader({ artist_id }).then(
          ({ earliest_created_year, latest_created_year }) => ({
            startAt: earliest_created_year,
            endAt: latest_created_year,
          })
        )
      },
      type: YearRange,
    },
  },
})
