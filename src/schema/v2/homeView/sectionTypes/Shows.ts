import { GraphQLObjectType } from "graphql"
import { ResolverContext } from "types/graphql"
import { NodeInterface } from "../../object_identification"
import { HomeViewGenericSectionInterface } from "./GenericSectionInterface"
import { HomeViewSectionTypeNames } from "./names"
import { standardSectionFields } from "./GenericSectionInterface"
import { ShowsConnection } from "schema/v2/show"
import { pageable } from "relay-cursor-paging"
import { emptyConnection } from "schema/v2/fields/pagination"
import Near from "schema/v2/input_fields/near"

export const HomeViewShowsSectionType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: HomeViewSectionTypeNames.HomeViewSectionShows,
  description: "A shows section in the home view",
  interfaces: [HomeViewGenericSectionInterface, NodeInterface],
  fields: {
    ...standardSectionFields,

    showsConnection: {
      type: ShowsConnection.connectionType,
      args: pageable({
        near: {
          type: Near,
          description: "Include shows within a radius of the provided location",
        },
      }),
      resolve: (parent, ...rest) =>
        parent.resolver ? parent.resolver(parent, ...rest) : emptyConnection,
    },
  },
})
