import { GraphQLNonNull, GraphQLString } from "graphql"
import BidderPosition from "schema/bidder_position"

export const BidderPositionStatus = {
  type: BidderPosition.type,
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
    { rootValue: { bidderPositionStatus } }
  ) =>
    bidderPositionStatus({
      id,
    }).then(response => response.body),
}
