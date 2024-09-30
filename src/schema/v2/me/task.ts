import { GraphQLString, GraphQLObjectType, GraphQLNonNull } from "graphql"
import { ResolverContext } from "types/graphql"
import { IDFields, NodeInterface } from "../object_identification"
import { date } from "./../fields/date"

const TaskType = new GraphQLObjectType<any, ResolverContext>({
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
    actionMessage: {
      type: new GraphQLNonNull(GraphQLString),
      resolve: ({ action_message }) => action_message,
    },
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

export default TaskType
