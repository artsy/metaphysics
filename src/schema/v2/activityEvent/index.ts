import { GraphQLNonNull, GraphQLObjectType, GraphQLString } from "graphql"
import { connectionWithCursorInfo } from "schema/v2/fields/pagination"
import { ResolverContext } from "types/graphql"
import { date } from "schema/v2/fields/date"
import { IDFields, NodeInterface } from "schema/v2/object_identification"

export const ActivityEventType = new GraphQLObjectType<any, ResolverContext>({
  name: "ActivityEvent",
  interfaces: [NodeInterface],
  fields: () => ({
    ...IDFields,
    title: {
      type: new GraphQLNonNull(GraphQLString),
      resolve: ({ title }) => title,
    },
    bodyText: {
      type: GraphQLString,
      resolve: ({ body_text }) => body_text,
    },
    targetURL: {
      type: new GraphQLNonNull(GraphQLString),
      resolve: ({ target_url }) => target_url,
    },
    publishedAt: date(({ published_at }) => published_at),
  }),
})

export const activityConnection = connectionWithCursorInfo({
  nodeType: ActivityEventType,
})
