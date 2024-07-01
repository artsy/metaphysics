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
import { Sellable } from "./sellable"
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
  fields: {
    ...InternalIDFields,
    dimensions: Dimensions,
    displayPriceRange: {
      type: GraphQLBoolean,
      resolve: ({ display_price_range }) => display_price_range,
    },
    editionOf: {
      type: GraphQLString,
      resolve: ({ editions }) => editions,
    },
    isAcquireable: {
      type: GraphQLBoolean,
      resolve: ({ acquireable }) => acquireable,
    },
    isOfferable: {
      type: GraphQLBoolean,
      resolve: ({ offerable }) => offerable,
    },
    isOfferableFromInquiry: {
      type: GraphQLBoolean,
      resolve: ({ offerable_from_inquiry }) => offerable_from_inquiry,
    },
    isForSale: {
      type: GraphQLBoolean,
      resolve: ({ forsale }) => forsale,
    },
    isSold: {
      type: GraphQLBoolean,
      resolve: ({ sold }) => sold,
    },
    listPrice,
    internalDisplayPrice: {
      type: GraphQLString,
      resolve: ({ internal_display_price }) => internal_display_price,
      description:
        "Price for internal partner display, requires partner access",
    },
    price: {
      type: GraphQLString,
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
  },
})

const EditionSet: GraphQLFieldConfig<void, ResolverContext> = {
  type: EditionSetType,
}

export default EditionSet
