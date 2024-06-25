import { GraphQLNonNull, GraphQLObjectType } from "graphql"
import { CollectorProfileType } from "schema/v2/CollectorProfile/collectorProfile"
import { ResolverContext } from "types/graphql"

export const CollectorProfileUpdatePromptNotificationItemType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "CollectorProfileUpdatePromptNotificationItem",
  fields: {
    collectorProfile: {
      type: GraphQLNonNull(CollectorProfileType),
      resolve: ({ object }) => object,
    },
  },
})
