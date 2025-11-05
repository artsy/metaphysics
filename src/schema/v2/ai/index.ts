import { GraphQLObjectType, GraphQLFieldConfig } from "graphql"
import { ResolverContext } from "types/graphql"
import { connectionWithCursorInfo } from "../fields/pagination"
import { pageable } from "relay-cursor-paging"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { paginationResolver } from "../fields/pagination"
import { GraphQLString, GraphQLInt } from "graphql"
import { AIPromptTemplateType } from "./aiPromptTemplate"

const AIType = new GraphQLObjectType<void, ResolverContext>({
  name: "AI",
  fields: {
    prompt: {
      type: AIPromptTemplateType,
      args: {
        id: {
          type: GraphQLString,
          description: "The ID of the AI prompt template",
        },
      },
      resolve: async (_, { id }, { aiPromptTemplateLoader }) => {
        if (!id) return null
        return await aiPromptTemplateLoader(id)
      },
    },
    promptConnection: {
      type: connectionWithCursorInfo({ nodeType: AIPromptTemplateType })
        .connectionType,
      args: pageable({
        page: {
          type: GraphQLInt,
        },
        size: {
          type: GraphQLInt,
        },
        name: {
          type: GraphQLString,
          description: "Filter by template name",
        },
        model: {
          type: GraphQLString,
          description: "Filter by model (e.g., claude, gpt)",
        },
      }),
      resolve: async (_, args, { aiPromptTemplatesLoader }) => {
        const { page, size, offset } = convertConnectionArgsToGravityArgs(args)
        const { name, model } = args

        const loaderArgs = {
          size,
          offset,
          total_count: true,
          ...(name && { name }),
          ...(model && { model }),
        }

        const { body, headers } = await aiPromptTemplatesLoader(loaderArgs)
        const totalCount = parseInt(headers["x-total-count"] || "0", 10)

        return paginationResolver({
          totalCount,
          offset,
          page,
          size,
          body,
          args,
        })
      },
    },
  },
})

export const AI: GraphQLFieldConfig<void, ResolverContext> = {
  type: AIType,
  resolve: () => ({}),
}
