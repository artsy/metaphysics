import { GraphQLObjectType } from "graphql"
import { pageable } from "relay-cursor-paging"
import {
  connectionWithCursorInfo,
  emptyConnection,
} from "schema/v2/fields/pagination"
import { TaskType } from "schema/v2/me/task"
import { NodeInterface } from "schema/v2/object_identification"
import { ResolverContext } from "types/graphql"
import {
  HomeViewGenericSectionInterface,
  standardSectionFields,
} from "./GenericSectionInterface"
import { HomeViewSectionTypeNames } from "./names"

export const HomeViewTasksSectionType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: HomeViewSectionTypeNames.HomeViewSectionTasks,
  description: "A tasks section in the home view",
  interfaces: [HomeViewGenericSectionInterface, NodeInterface],
  fields: {
    ...standardSectionFields,

    tasksConnection: {
      type: connectionWithCursorInfo({
        nodeType: TaskType,
      }).connectionType,
      args: pageable({}),
      resolve: (parent, ...rest) =>
        parent.resolver ? parent.resolver(parent, ...rest) : emptyConnection,
    },
  },
})
