import { LotStandingType } from "./lot_standing"
import { GraphQLNonNull, GraphQLString, GraphQLFieldConfig } from "graphql"
import { ResolverContext } from "types/graphql"

const BidderStatus: GraphQLFieldConfig<void, ResolverContext> = {
  type: LotStandingType,
  description: "The current user's status relating to bids on artworks",
  args: {
    artworkID: {
      type: new GraphQLNonNull(GraphQLString),
    },
    saleID: {
      type: new GraphQLNonNull(GraphQLString),
    },
  },
  resolve: (
    _root,
    { saleID: sale_id, artworkID: artwork_id },
    { lotStandingLoader }
  ) =>
    !lotStandingLoader
      ? null
      : lotStandingLoader({
          sale_id,
          artwork_id,
        }).then((lotStanding) => {
          if (lotStanding.length === 0) return null
          return lotStanding[0]
        }),
}

export default BidderStatus
