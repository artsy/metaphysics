import {
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLString,
  GraphQLFieldConfig,
  GraphQLBoolean,
} from "graphql"
import { ResolverContext } from "types/graphql"
import { IDFields } from "../object_identification"

export const ConversationMessageTemplateType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "ConversationMessageTemplate",
  fields: () => ({
    ...IDFields,
    title: {
      type: new GraphQLNonNull(GraphQLString),
    },
    description: {
      type: GraphQLString,
    },
    body: {
      type: new GraphQLNonNull(GraphQLString),
    },
    currentVersionId: {
      type: new GraphQLNonNull(GraphQLString),
      resolve: ({ current_version_id }) => current_version_id,
    },
    sourceExampleId: {
      type: GraphQLString,
      resolve: ({ source_example_id }) => source_example_id,
    },
    isDeleted: {
      type: new GraphQLNonNull(GraphQLBoolean),
      resolve: ({ is_deleted }) => is_deleted ?? false,
    },
  }),
})

const ConversationMessageTemplate: GraphQLFieldConfig<void, ResolverContext> = {
  type: ConversationMessageTemplateType,
  description: "A Conversation Message Template",
  args: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The ID of the Conversation Message Template",
    },
  },
  resolve: async (_root, { id }, { conversationMessageTemplateLoader }) => {
    if (!conversationMessageTemplateLoader) {
      throw new Error(
        "You need to pass a X-Access-Token header to perform this action"
      )
    }
    return conversationMessageTemplateLoader(id)
  },
}

export default ConversationMessageTemplate
