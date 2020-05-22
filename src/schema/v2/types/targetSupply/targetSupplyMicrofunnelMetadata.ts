import { GraphQLObjectType, GraphQLString, GraphQLList } from "graphql"
import { ResolverContext } from "types/graphql"

export const TargetSupplyMicrofunnelMetadata = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "TargetSupplyMicrofunnelMetadata",
  fields: {
    highestRealized: {
      type: GraphQLString,
    },
    realized: {
      type: GraphQLString,
    },
    recentlySoldArtworkIDs: {
      type: new GraphQLList(GraphQLString),
    },
    roundedUniqueVisitors: {
      type: GraphQLString,
    },
    roundedViews: {
      type: GraphQLString,
    },
    str: {
      type: GraphQLString,
    },
    uniqueVisitors: {
      type: GraphQLString,
    },
    views: {
      type: GraphQLString,
    },
  },
})
