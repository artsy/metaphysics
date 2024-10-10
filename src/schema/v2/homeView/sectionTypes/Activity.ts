import { GraphQLObjectType } from "graphql"
import { pageable } from "relay-cursor-paging"
import { ResolverContext } from "types/graphql"
import { NotificationsConnection } from "../../notifications"
import { NodeInterface } from "../../object_identification"
import { HomeViewGenericSectionInterface } from "./GenericSectionInterface"
import { HomeViewSectionTypeNames } from "./names"
import { standardSectionFields } from "./GenericSectionInterface"
import { emptyConnection } from "schema/v2/fields/pagination"

export const HomeViewActivitySectionType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: HomeViewSectionTypeNames.HomeViewSectionActivity,
  description: "A user activity section in the home view",
  interfaces: [HomeViewGenericSectionInterface, NodeInterface],
  fields: {
    ...standardSectionFields,

    notificationsConnection: {
      type: NotificationsConnection.type,

      args: pageable({}),
      resolve: (parent, ...rest) => {
        return parent.resolver
          ? parent.resolver(parent, ...rest)
          : emptyConnection
      },
    },
  },
})
