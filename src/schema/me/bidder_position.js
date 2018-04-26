import { GraphQLNonNull, GraphQLString } from "graphql"
import BidderPositionType from "schema/bidder_position"

export const BidderPosition = {
  type: BidderPositionType.type,
  description: "Returns a single bidder position",
  args: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
    },
  },
  resolve: (
    root,
    { id },
    request,
    { rootValue: { bidderPositionLoader } }
  ) =>
    bidderPositionLoader({
      id,
    }).then(response => response.body),
}
