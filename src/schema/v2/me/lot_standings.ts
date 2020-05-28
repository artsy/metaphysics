import LotStanding from "./lot_standing"
import { ResolverContext } from "types/graphql"
import {
  GraphQLList,
  GraphQLBoolean,
  GraphQLString,
  GraphQLFieldConfig,
} from "graphql"

const LotStandings: GraphQLFieldConfig<void, ResolverContext> = {
  type: new GraphQLList(LotStanding.type),
  description: "A list of the current user's auction standings for given lots",
  args: {
    activePositions: {
      type: GraphQLBoolean,
      description:
        "Only includes lots on which you have a leading bidder position.",
    },
    artworkID: {
      type: GraphQLString,
      description: "Only the lot standings on a specific artwork",
    },
    live: {
      type: GraphQLBoolean,
      description:
        "Only the lot standings for currently open or closed auctions.",
    },
    saleID: {
      type: GraphQLString,
      description: "Only the lot standings for a specific auction",
    },
    saleArtworkID: {
      type: GraphQLString,
    },
  },
  resolve: (
    _root,
    {
      activePositions: active_positions,
      artworkID: artwork_id,
      live,
      saleID: sale_id,
      saleArtworkID: sale_artwork_id,
    },
    { lotStandingLoader }
  ) => {
    if (!lotStandingLoader) return null
    return lotStandingLoader({
      active_positions,
      artwork_id,
      live,
      sale_id,
      sale_artwork_id,
    }).then((lotStandings) => {
      return lotStandings
    })
  },
}

export default LotStandings
