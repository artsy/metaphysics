import {
  GraphQLID,
  GraphQLInt,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"
import { connectionDefinitions } from "graphql-relay"
import Artwork from "schema/artwork"
import { OrderFulfillmentConnection } from "./order_fulfillment"
import { amount } from "schema/fields/money"
import date from "schema/fields/date"
import { ArtworkVersion } from "../../artwork_version"
import { ResolverContext } from "types/graphql"
import { InternalIDFields } from "schema/object_identification"

export const OrderLineItemType = new GraphQLObjectType<any, ResolverContext>({
  name: "OrderLineItem",
  fields: () => ({
    ...InternalIDFields,
    artwork: {
      type: Artwork.type,
      description: "Artwork that is being ordered",
      resolve: (
        { artworkId },
        _args,
        { authenticatedLoaders: { artworkLoader } }
      ) => (artworkLoader ? artworkLoader(artworkId) : null),
    },
    artworkVersion: {
      type: ArtworkVersion,
      description: "Artwork version that is being ordered",

      resolve: (
        { artworkVersionId },
        _args,
        { authenticatedArtworkVersionLoader }
      ) =>
        authenticatedArtworkVersionLoader
          ? authenticatedArtworkVersionLoader(artworkVersionId)
          : null,
    },
    editionSetId: {
      type: GraphQLString,
      description: "ID of the selected Edition set from the artwork",
    },
    priceCents: {
      type: GraphQLInt,
      description: "Unit price in cents",
      deprecationReason: "Switched to `listPriceCents`",
    },
    price: amount(({ priceCents }) => priceCents),
    listPriceCents: {
      type: GraphQLInt,
      description: "Unit list price in cents",
    },
    listPrice: amount(({ listPriceCents }) => listPriceCents),
    updatedAt: date,
    createdAt: date,
    quantity: {
      type: GraphQLInt,
      description: "Quantity of items in this line item",
    },
    fulfillments: {
      type: OrderFulfillmentConnection,
      description: "List of order line items",
    },
  }),
})

export const {
  connectionType: OrderLineItemConnection,
  edgeType: OrderLineItemEdge,
} = connectionDefinitions({
  nodeType: OrderLineItemType,
})
