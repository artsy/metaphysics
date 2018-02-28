import { LotStandingType } from "./lot_standing"
import { GraphQLNonNull, GraphQLString } from "graphql"

export default {
  type: LotStandingType,
  description: "The current user's status relating to bids on artworks",
  args: {
    artwork_id: {
      type: new GraphQLNonNull(GraphQLString),
    },
    sale_id: {
      type: new GraphQLNonNull(GraphQLString),
    },
  },
  resolve: (
    root,
    { sale_id, artwork_id },
    request,
    { rootValue: { lotStandingLoader } }
  ) =>
    lotStandingLoader({
      sale_id,
      artwork_id,
    }).then(lotStanding => {
      if (lotStanding.length === 0) return null
      return lotStanding[0]
    }),
}
