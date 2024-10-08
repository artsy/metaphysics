import { GraphQLObjectType } from "graphql"
import { ResolverContext } from "types/graphql"
import { NodeInterface } from "../../object_identification"
import { HomeViewGenericSectionInterface } from "../HomeViewGenericSectionInterface"
import { HomeViewSectionTypeNames } from "../HomeViewSectionTypeNames"
import { standardSectionFields } from "../standardSectionFields"

export const HomeViewViewingRoomsSectionType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: HomeViewSectionTypeNames.HomeViewSectionViewingRooms,
  description: "A viewing rooms section in the home view",
  interfaces: [HomeViewGenericSectionInterface, NodeInterface],
  fields: {
    ...standardSectionFields,
  },
})
