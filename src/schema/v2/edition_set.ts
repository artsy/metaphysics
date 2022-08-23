import { isEmpty, includes } from "lodash"
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
import { capitalizeFirstCharacter } from "lib/helpers"
import { Sellable } from "./sellable"
import { ResolverContext } from "types/graphql"
import { listPrice } from "./fields/listPrice"

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

const EditionSetAvailabilities = [
  "sold",
  "on hold",
  "on loan",
  "permanent collection",
]

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
      resolve: ({ availability, availability_hidden, price, forsale }) => {
        // Don't display anything if availability is hidden.
        if (availability_hidden) {
          return null
        }

        // If it's a supported availability, just return it (capitalized).
        if (includes(EditionSetAvailabilities, availability)) {
          return capitalizeFirstCharacter(availability)
        }

        // If there's a price string, just return it.
        if (!isEmpty(price)) {
          return price
        }

        // If its for sale (and no price), return 'Available'.
        if (forsale) {
          return "Contact for price"
        }

        return "No longer available"
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
