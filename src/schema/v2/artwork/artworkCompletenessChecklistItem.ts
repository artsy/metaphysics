import { GraphQLBoolean, GraphQLNonNull, GraphQLObjectType } from "graphql"
import { ResolverContext } from "types/graphql"
import { ArtworkCompletenessChecklistItemKey } from "./artworkCompletenessChecklistItemKey"

export const ArtworkCompletenessChecklistItemType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "ArtworkCompletenessChecklistItem",
  fields: {
    key: {
      type: new GraphQLNonNull(ArtworkCompletenessChecklistItemKey),
      description: "The key/identifier of the validation",
      resolve: ({ key }) => key,
    },
    completed: {
      type: new GraphQLNonNull(GraphQLBoolean),
      description: "Whether this checklist item is completed",
      resolve: ({ completed }) => completed,
    },
  },
})
