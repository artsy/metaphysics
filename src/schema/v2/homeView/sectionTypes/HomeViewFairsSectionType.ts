import { GraphQLObjectType } from "graphql"
import { pageable } from "relay-cursor-paging"
import { ResolverContext } from "types/graphql"
import { fairsConnection } from "../../fairs"
import { NodeInterface } from "../../object_identification"
import { HomeViewGenericSectionInterface } from "../HomeViewGenericSectionInterface"
import { HomeViewSectionTypeNames } from "./names"
import { standardSectionFields } from "./standardSectionFields"

export const HomeViewFairsSectionType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: HomeViewSectionTypeNames.HomeViewSectionFairs,
  description: "A fairs section in the home view",
  interfaces: [HomeViewGenericSectionInterface, NodeInterface],
  fields: {
    ...standardSectionFields,

    fairsConnection: {
      type: fairsConnection.type,
      args: pageable({}),
      resolve: (parent, ...rest) =>
        parent.resolver ? parent.resolver(parent, ...rest) : [],
    },
  },
})
