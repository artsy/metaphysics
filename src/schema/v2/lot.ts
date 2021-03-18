import { GraphQLInt, GraphQLObjectType, GraphQLString } from "graphql"
import { SaleArtworkType } from "schema/v2/sale_artwork"
import { ResolverContext } from "types/graphql"
import {
  NodeInterface,
  SlugAndInternalIDFields,
} from "schema/v2/object_identification"
import { Money, resolveLotCentsFieldToMoney } from "./fields/money"

export const Lot = new GraphQLObjectType<any, ResolverContext>({
  name: "Lot",
  description:
    "A lot in an auction containing merged SaleArtwork and LotState data, stitched from causality.",
  interfaces: () => {
    return [NodeInterface]
  },
  fields: () => {
    return {
      ...SlugAndInternalIDFields,
      saleArtwork: {
        type: SaleArtworkType,
        description: "The watched saleArtwork object.",
        resolve: (artwork) => artwork,
      },
    }
  },
})

/**
 * TODO: This may be migrated to Gravity once we finish moving Causality's
 * bidding engine. For now, naming the type after Causality so that it's
 * unambiguous.
 */
export const CausalityLotState = new GraphQLObjectType({
  name: "CausalityLotState",
  fields: () => ({
    bidCount: {
      type: GraphQLInt,
    },
    floorSellingPrice: {
      type: Money,
      resolve: resolveLotCentsFieldToMoney("floorSellingPriceCents"),
    },
    floorSellingPriceCents: {
      type: GraphQLInt,
    },
    internalID: {
      type: GraphQLString,
    },
    onlineAskingPrice: {
      type: Money,
      resolve: resolveLotCentsFieldToMoney("onlineAskingPriceCents"),
    },
    onlineAskingPriceCents: {
      type: GraphQLInt,
    },
    reserveStatus: {
      type: GraphQLString,
    },
    saleId: {
      type: GraphQLString,
    },
    sellingPrice: {
      type: Money,
      resolve: resolveLotCentsFieldToMoney("sellingPriceCents"),
    },
    sellingPriceCents: {
      type: GraphQLInt,
    },
    soldStatus: {
      type: GraphQLString,
    },
  }),
})
