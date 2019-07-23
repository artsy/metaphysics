import { GraphQLString, GraphQLObjectType, GraphQLNonNull } from "graphql"
import BidderPosition from "schema/v1/bidder_position"
import { ResolverContext } from "types/graphql"

export const BidderPositionResultType = new GraphQLObjectType<
  any,
  ResolverContext
>({
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
