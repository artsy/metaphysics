import { GraphQLString, GraphQLObjectType, GraphQLNonNull } from "graphql"
import BidderPosition from "schema/v2/bidder_position"
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
    messageHeader: {
      type: GraphQLString,
    },
    messageDescriptionMD: {
      type: GraphQLString,
    },
    position: {
      type: BidderPosition.type,
    },
    rawError: {
      type: GraphQLString,
    },
  }),
})
