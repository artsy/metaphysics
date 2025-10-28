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
    type: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The type/identifier of the validation",
      resolve: ({ type }) => type,
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
