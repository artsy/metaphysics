import { GraphQLBoolean, GraphQLInterfaceType, GraphQLString } from "graphql"

import Dimensions from "./dimensions"
import { InternalIDFields } from "./object_identification"
import { Money } from "./fields/money"
import { listPrice } from "./fields/listPrice"

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
  },
  displayPriceRange: {
    type: GraphQLBoolean,
  },
  internalDisplayPrice: {
    type: GraphQLString,
  },
  isEcommerce: {
    type: GraphQLBoolean,
  },
  isInAuction: {
    type: GraphQLBoolean,
  },
  isInquireable: {
    type: GraphQLBoolean,
  },
  isOfferable: {
    type: GraphQLBoolean,
  },
  isPriceHidden: {
    type: GraphQLBoolean,
  },
  priceListed: {
    type: Money,
  },
  listPrice,
  published: {
    type: GraphQLBoolean,
  },
}
