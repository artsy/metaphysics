import { isEmpty, includes } from "lodash"
import { IDFields } from "./object_identification"
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

const EditionSetType = new GraphQLObjectType<any, ResolverContext>({
  name: "EditionSet",
  interfaces: [Sellable],
  fields: {
    ...IDFields,
    dimensions: Dimensions,
    edition_of: {
      type: GraphQLString,
      resolve: ({ editions }) => editions,
    },
    is_acquireable: {
      type: GraphQLBoolean,
      resolve: ({ acquireable }) => acquireable,
    },
    is_offerable: {
      type: GraphQLBoolean,
      resolve: ({ offerable }) => offerable,
    },
    is_for_sale: {
      type: GraphQLBoolean,
      resolve: ({ forsale }) => forsale,
    },
    is_sold: {
      type: GraphQLBoolean,
      resolve: ({ sold }) => sold,
    },
    price: {
      type: GraphQLString,
      resolve: ({ price, forsale }) => {
        const fallback = forsale ? "Available" : "Not for Sale"
        return !isEmpty(price) ? price : fallback
      },
      deprecationReason: "Prefer to use `sale_message`.",
    },
    listPrice,
    sale_message: {
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
