import { GraphQLNonNull, GraphQLObjectType, GraphQLString } from "graphql"
import { ResolverContext } from "types/graphql"
import { IDFields, NodeInterface } from "../object_identification"
import { date } from "./../fields/date"
import { connectionWithCursorInfo } from "../fields/pagination"

export interface Task {
  image_url: string
  title: string
  created_at: string
  message: string
  action_link: string
  resolved_at: string
  dismissed_at: string
  expires_at: string
  task_type: string
  source_id: string
  source_type: string
}

export const TaskType = new GraphQLObjectType<any, ResolverContext>({
  name: "Task",
  interfaces: [NodeInterface],
  fields: () => ({
    ...IDFields,
    imageUrl: {
      type: new GraphQLNonNull(GraphQLString),
      resolve: ({ image_url }) => image_url,
    },
    title: { type: new GraphQLNonNull(GraphQLString) },
    message: { type: new GraphQLNonNull(GraphQLString) },
    actionLink: {
      type: new GraphQLNonNull(GraphQLString),
      resolve: ({ action_link }) => action_link,
    },
    resolvedAt: date(),
    dismissedAt: date(),
    expiresAt: date(),
    taskType: {
      type: new GraphQLNonNull(GraphQLString),
      resolve: ({ task_type }) => task_type,
    },
    sourceId: { type: GraphQLString, resolve: ({ source_id }) => source_id },
    sourceType: {
      type: GraphQLString,
      resolve: ({ source_type }) => source_type,
    },
    createdAt: date(),
  }),
})

export const TaskConnectionType = connectionWithCursorInfo({
  nodeType: TaskType,
}).connectionType
