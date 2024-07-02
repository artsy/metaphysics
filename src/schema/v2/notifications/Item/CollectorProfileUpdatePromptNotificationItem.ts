import { GraphQLNonNull, GraphQLObjectType } from "graphql"
import { CollectorProfileType } from "schema/v2/CollectorProfile/collectorProfile"
import { meType } from "schema/v2/me"
import { ResolverContext } from "types/graphql"

export const CollectorProfileUpdatePromptNotificationItemType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "CollectorProfileUpdatePromptNotificationItem",
  fields: () => ({
    collectorProfile: {
      type: new GraphQLNonNull(CollectorProfileType),
      resolve: ({ object }) => object,
    },
    me: {
      type: new GraphQLNonNull(meType),
      resolve: (_source, _args, { meLoader }) => {
        return meLoader?.()
      },
    },
  }),
})
