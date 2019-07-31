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
      resolve: ({ message_header }) => message_header,
    },
    messageDescriptionMD: {
      type: GraphQLString,
      resolve: ({ message_description_md }) => message_description_md,
    },
    position: {
      type: BidderPosition.type,
    },
  }),
})
