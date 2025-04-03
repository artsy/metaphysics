import { GraphQLBoolean, GraphQLInterfaceType, GraphQLString } from "graphql"

import Dimensions from "./dimensions"
import { InternalIDFields } from "./object_identification"

export const Sellable = new GraphQLInterfaceType({
  name: "Sellable",
  description: "A piece that can be sold",
  fields: () => ({
    ...sharedSellableFields,
    dimensions: Dimensions,
    editionOf: {
      type: GraphQLString,
      resolve: ({ edition_of }) => edition_of,
    },
    isAcquireable: {
      type: GraphQLBoolean,
      description: "Whether a piece can be purchased through e-commerce",
      resolve: ({ is_acquireable }) => is_acquireable,
    },
    isOfferable: {
      type: GraphQLBoolean,
      description: "Whether a user can make an offer on the work",
      resolve: ({ is_offerable }) => is_offerable,
    },
    isOfferableFromInquiry: {
      type: GraphQLBoolean,
      description:
        "Whether a user can make an offer on the work through inquiry",
      resolve: ({ is_offerable_from_inquiry }) => is_offerable_from_inquiry,
    },
    isForSale: {
      type: GraphQLBoolean,
      resolve: ({ is_for_sale }) => is_for_sale,
    },
    isSold: {
      type: GraphQLBoolean,
      resolve: ({ is_sold }) => is_sold,
    },
    saleMessage: {
      type: GraphQLString,
      resolve: ({ sale_message }) => sale_message,
    },
  }),
})

export const sharedSellableFields = {
  // Note: while EditionSets require this field to perform mutation updates,
  // since they're technically embedded documents on the artwork, they're not
  // queryable in isolation, by ID. They exist only in the context of the artwork.
  ...InternalIDFields,
  availability: {
    type: GraphQLString,
  },
  displayLabel: {
    type: GraphQLString,
    resolve: ({ title }) => title,
  },
  displayPriceRange: {
    type: GraphQLBoolean,
    resolve: ({ display_price_range }) => display_price_range,
  },
  internalDisplayPrice: {
    type: GraphQLString,
    resolve: ({ internal_display_price }) => internal_display_price,
    description: "Price for internal partner display, requires partner access",
  },
  isInAuction: {
    type: GraphQLBoolean,
    description: "Is this artwork part of an auction?",
    resolve: async ({ sale_ids }, _options, { salesLoader }) => {
      if (sale_ids && sale_ids.length > 0) {
        const sales = await salesLoader({
          id: sale_ids,
          is_auction: true,
        })

        return sales.length > 0
      }

      return false
    },
  },
  isInquireable: {
    type: GraphQLBoolean,
    description: "Do we want to encourage inquiries on this work?",
    resolve: ({ inquireable }) => inquireable,
  },
  isPriceHidden: {
    type: GraphQLBoolean,
    resolve: ({ price_hidden }) => price_hidden,
  },
  published: {
    type: GraphQLBoolean,
    description: "Whether this artwork is published or not",
  },
}
