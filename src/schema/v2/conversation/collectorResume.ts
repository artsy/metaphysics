import {
  GraphQLObjectType,
  GraphQLString,
  GraphQLNonNull,
  GraphQLBoolean,
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
  }),
})
