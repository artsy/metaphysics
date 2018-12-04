import LotStanding from "./lot_standing"
import { GraphQLList, GraphQLBoolean, GraphQLString } from "graphql"

export default {
  type: new GraphQLList(LotStanding.type),
  description: "A list of the current user's auction standings for given lots",
  args: {
    active_positions: {
      type: GraphQLBoolean,
      description:
        "Only includes lots on which you have a leading bidder position.",
    },
    artwork_id: {
      type: GraphQLString,
      description: "Only the lot standings on a specific artwork",
    },
    live: {
      type: GraphQLBoolean,
      description:
        "Only the lot standings for currently open or closed auctions.",
    },
    sale_id: {
      type: GraphQLString,
      description: "Only the lot standings for a specific auction",
    },
    sale_artwork_id: {
      type: GraphQLString,
    },
  },
  resolve: (
    root,
    { active_positions, artwork_id, live, sale_id, sale_artwork_id },
    request,
    { rootValue: { lotStandingLoader } }
  ) => {
    if (!lotStandingLoader) return null
    return lotStandingLoader({
      active_positions,
      artwork_id,
      live,
      sale_id,
      sale_artwork_id,
    }).then(lotStandings => {
      return lotStandings
    })
  },
}
