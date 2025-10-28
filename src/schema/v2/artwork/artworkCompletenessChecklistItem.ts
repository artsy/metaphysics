import {
  GraphQLBoolean,
  GraphQLInt,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"
import { ResolverContext } from "types/graphql"

export const ArtworkCompletenessChecklistItemType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "ArtworkCompletenessChecklistItem",
  fields: {
    key: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The key/identifier of the validation",
      resolve: ({ key }) => key,
    },
    completed: {
      type: new GraphQLNonNull(GraphQLBoolean),
      description: "Whether this checklist item is completed",
      resolve: ({ completed }) => completed,
    },
    weight: {
      type: new GraphQLNonNull(GraphQLInt),
      description: "The score weight of this validation",
      resolve: ({ weight }) => weight,
    },
  },
})
