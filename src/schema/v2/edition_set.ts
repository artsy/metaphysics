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
} from "graphql"
import { Sellable, sharedSellableFields } from "./sellable"
import { ResolverContext } from "types/graphql"
import { listPrice } from "./fields/listPrice"
import { Money } from "./fields/money"
import currencyCodes from "lib/currency_codes.json"

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
      resolve: ({ artwork }) => artwork.availability,
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
    internalDisplayPrice: {
      type: GraphQLString,
      resolve: ({ internal_display_price }) => internal_display_price,
      description:
        "Price for internal partner display, requires partner access",
    },
    isAcquireable: {
      type: GraphQLBoolean,
      resolve: ({ acquireable }) => acquireable,
    },
    isEcommerce: {
      type: GraphQLBoolean,
      resolve: ({ ecommerce }) => ecommerce,
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
    published: {
      type: GraphQLBoolean,
      description: "Is the edition set parent-artwork published?",
      resolve: ({ artwork }) => artwork.published,
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
    widthCm: {
      description:
        "If you need to render artwork dimensions as a string, prefer the `Artwork#dimensions` field",
      type: GraphQLFloat,
      resolve: ({ width_cm }) => width_cm,
    },
    heightCm: {
      description:
        "If you need to render artwork dimensions as a string, prefer the `Artwork#dimensions` field",
      type: GraphQLFloat,
      resolve: ({ height_cm }) => height_cm,
    },
  }),
})

const EditionSet: GraphQLFieldConfig<void, ResolverContext> = {
  type: EditionSetType,
}

export default EditionSet
