import { isEmpty } from "lodash"
import { InternalIDFields } from "./object_identification"
import Dimensions from "./dimensions"
import {
  GraphQLString,
  GraphQLBoolean,
  GraphQLObjectType,
  GraphQLEnumType,
  GraphQLFieldConfig,
  GraphQLFloat,
  GraphQLList,
  GraphQLInt,
} from "graphql"
import { Sellable, sharedSellableFields } from "./sellable"
import { ResolverContext } from "types/graphql"
import { listPrice } from "./fields/listPrice"
import { Money } from "./fields/money"
import currencyCodes from "lib/currency_codes.json"
import { listingOptions } from "./artwork/listingOptions"

export const EditionSetSorts = {
  type: new GraphQLEnumType({
    name: "EditionSetSorts",
    values: {
      PRICE_ASC: {
        value: "price",
      },
    },
  }),
}

export const EditionSetType = new GraphQLObjectType<any, ResolverContext>({
  name: "EditionSet",
  interfaces: [Sellable],
  fields: () => ({
    ...InternalIDFields,
    ...sharedSellableFields,

    availability: {
      type: GraphQLString,
      resolve: ({ availability }) => availability,
    },
    artistProofs: {
      type: GraphQLBoolean,
      resolve: ({ artist_proofs }) => artist_proofs,
    },
    availableEditions: {
      type: new GraphQLList(GraphQLString),
      resolve: ({ available_editions }) => available_editions,
    },
    depth: {
      type: GraphQLString,
      resolve: ({ depth }) => depth,
    },
    diameter: {
      type: GraphQLString,
      resolve: ({ diameter }) => diameter,
    },
    duration: {
      type: GraphQLString,
      resolve: ({ duration }) => duration,
    },
    dimensions: Dimensions,
    displayLabel: {
      description: "The edition set parent-artwork display label (title)",
      type: GraphQLString,
      resolve: ({ artwork }) => artwork.title,
    },
    displayPriceRange: {
      type: GraphQLBoolean,
      resolve: ({ display_price_range }) => display_price_range,
    },
    editionOf: {
      type: GraphQLString,
      resolve: ({ editions }) => editions,
    },
    editionSize: {
      type: GraphQLString,
      resolve: ({ edition_size }) => edition_size,
    },
    framedDepth: {
      type: GraphQLString,
      resolve: ({ framed_depth }) => framed_depth,
    },
    framedWidth: {
      type: GraphQLString,
      resolve: ({ framed_width }) => framed_width,
    },
    framedHeight: {
      type: GraphQLString,
      resolve: ({ framed_height }) => framed_height,
    },
    framedDiameter: {
      type: GraphQLString,
      resolve: ({ framed_diameter }) => framed_diameter,
    },
    framedMetric: {
      type: GraphQLString,
      resolve: ({ framed_metric }) => framed_metric,
    },
    height: {
      type: GraphQLString,
      resolve: ({ height }) => height,
    },
    heightCm: {
      description:
        "If you need to render artwork dimensions as a string, prefer the `Artwork#dimensions` field",
      type: GraphQLFloat,
      resolve: ({ height_cm }) => height_cm,
    },
    internalDisplayPrice: {
      type: GraphQLString,
      resolve: ({ internal_display_price }) => internal_display_price,
      description:
        "Price for internal partner display, requires partner access",
    },
    inventory: {
      type: new GraphQLObjectType({
        name: "EditionSetInventory",
        fields: {
          count: {
            type: GraphQLInt,
            resolve: ({ count }) => count,
          },
          isUnlimited: {
            type: GraphQLBoolean,
            resolve: ({ unlimited }) => unlimited,
          },
        },
      }),
      resolve: ({ inventory }) => inventory,
    },
    isAcquireable: {
      type: GraphQLBoolean,
      resolve: ({ acquireable }) => acquireable,
    },
    isForSale: {
      type: GraphQLBoolean,
      resolve: ({ forsale }) => forsale,
    },
    isInAuction: {
      type: GraphQLBoolean,
      description: "Is the edition set parent-artwork part of an auction?",
      resolve: async ({ artwork }, _options, { salesLoader }) => {
        if (artwork.sale_ids && artwork.sale_ids.length > 0) {
          const sales = await salesLoader({
            id: artwork.sale_ids,
            is_auction: true,
          })

          return sales.length > 0
        }

        return false
      },
    },
    isInquireable: {
      type: GraphQLBoolean,
      description: "Is the edition set parent-artwork inquireable?",
      resolve: ({ artwork }) => artwork.inquireable,
    },
    isOfferable: {
      type: GraphQLBoolean,
      resolve: ({ offerable }) => offerable,
    },
    isOfferableFromInquiry: {
      type: GraphQLBoolean,
      resolve: ({ offerable_from_inquiry }) => offerable_from_inquiry,
    },
    isPriceHidden: {
      type: GraphQLBoolean,
      resolve: ({ price_hidden }) => price_hidden,
    },
    isSold: {
      type: GraphQLBoolean,
      resolve: ({ sold }) => sold,
    },
    listingOptions,
    listPrice,
    price: {
      type: GraphQLString,
    },
    priceDisplay: {
      type: GraphQLString,
      resolve: ({ price_display }) => price_display,
    },
    priceListed: {
      type: Money,
      resolve: ({ price_listed: price_listed, price_currency: currency }) => {
        const factor =
          currencyCodes[currency?.toLowerCase()]?.subunit_to_unit ?? 100
        const cents = price_listed * factor
        return { cents, currency }
      },
    },
    prototypes: {
      type: GraphQLString,
      resolve: ({ prototypes }) => prototypes,
    },
    published: {
      type: GraphQLBoolean,
      description: "Is the edition set parent-artwork published?",
      resolve: ({ artwork }) => artwork.published,
    },
    shippingWeight: {
      type: GraphQLString,
      resolve: ({ shipping_weight }) => shipping_weight,
    },
    shippingWeightMetric: {
      type: GraphQLString,
      resolve: ({ shipping_weight_metric }) => shipping_weight_metric,
    },
    sizeScore: {
      description: "score assigned to an artwork based on its dimensions",
      type: GraphQLFloat,
      resolve: ({ size_score }) => size_score,
    },
    sizeBucket: {
      description: "size bucket assigned to an artwork based on its dimensions",
      type: GraphQLString,
      resolve: ({ size_bucket }) => size_bucket,
    },
    saleMessage: {
      type: GraphQLString,
      resolve: ({ price, forsale, sale_message }) => {
        if (!forsale || isEmpty(price)) {
          return sale_message
        }

        // If there's a price string, just return it.
        return price
      },
    },
    width: {
      type: GraphQLString,
      resolve: ({ width }) => width,
    },
    widthCm: {
      description:
        "If you need to render artwork dimensions as a string, prefer the `Artwork#dimensions` field",
      type: GraphQLFloat,
      resolve: ({ width_cm }) => width_cm,
    },
  }),
})

const EditionSet: GraphQLFieldConfig<void, ResolverContext> = {
  type: EditionSetType,
}

export default EditionSet
