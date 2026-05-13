import {
  GraphQLObjectType,
  GraphQLString,
  GraphQLNonNull,
  GraphQLBoolean,
  GraphQLInt,
} from "graphql"
import { CollectorProfileType } from "schema/v2/CollectorProfile/collectorProfile"
import { ResolverContext } from "types/graphql"

export const CollectorResume = new GraphQLObjectType<any, ResolverContext>({
  name: "CollectorResume",
  fields: () => ({
    collectorProfile: {
      type: GraphQLNonNull(CollectorProfileType),
      resolve: ({ collectorProfile }) => collectorProfile,
    },
    isCollectorFollowingPartner: {
      type: GraphQLNonNull(GraphQLBoolean),
      description: "The Collector follows the Gallery profile",
      resolve: ({ isCollectorFollowingPartner }) => isCollectorFollowingPartner,
    },
    userId: {
      type: GraphQLNonNull(GraphQLString),
      description:
        "Collector's ID used to stitch buyerActivity with the Exchange schema",
      resolve: ({ userId }) => userId,
    },
    purchases: {
      type: CollectorPurchasesType,
      description: "non-bnmo Collector's purchase history",
      resolve: ({ purchases }) => purchases,
    },
  }),
})

const CollectorPurchasesType = new GraphQLObjectType<any, ResolverContext>({
  name: "purchases",
  fields: {
    totalAuctionCount: {
      type: GraphQLNonNull(GraphQLInt),
      description: "Total number of auction winning bids",
      resolve: ({ auction }) => auction || 0,
    },
    totalPrivateSaleCount: {
      type: GraphQLNonNull(GraphQLInt),
      description: "Total number of private sales",
      resolve: (data) => data["private sale"] || 0,
    },
  },
})
