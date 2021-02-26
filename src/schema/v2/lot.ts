import { GraphQLObjectType } from "graphql"
import { SaleArtworkType } from "schema/v2/sale_artwork"
import { ResolverContext } from "types/graphql"
import {
  NodeInterface,
  SlugAndInternalIDFields,
} from "schema/v2/object_identification"

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
