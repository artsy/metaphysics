import { GraphQLObjectType, GraphQLBoolean } from "graphql"
import { CollectorProfileType } from "schema/v2/CollectorProfile/collectorProfile"
import { ResolverContext } from "types/graphql"

export const CollectorResume = new GraphQLObjectType<any, ResolverContext>({
  name: "CollectorResume",
  fields: () => ({
    collectorProfile: {
      type: CollectorProfileType,
      resolve: ({ collector_profile }) => collector_profile,
    },
    hasPartnerFollow: {
      type: GraphQLBoolean,
      description: "The Collector follows the Gallery profile",
      resolve: ({ follows_profile }) => follows_profile,
    },
  }),
})
