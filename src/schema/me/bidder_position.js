import { GraphQLNonNull, GraphQLString } from "graphql"
import BidderPositionType from "schema/bidder_position"

export const BidderPosition = {
  type: BidderPositionType.type,
  description: "Returns the bidder position status",
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
