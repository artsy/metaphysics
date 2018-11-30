import { GraphQLString, GraphQLObjectType, GraphQLNonNull } from "graphql"
import BidderPosition from "schema/bidder_position"

export const BidderPositionResultType = new GraphQLObjectType({
  name: "BidderPositionResult",
  fields: () => ({
    status: {
      type: new GraphQLNonNull(GraphQLString),
    },
    message_header: {
      type: GraphQLString,
    },
    message_description_md: {
      type: GraphQLString,
    },
    position: {
      type: BidderPosition.type,
    },
  }),
})
