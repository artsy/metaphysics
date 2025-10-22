import { GraphQLFieldConfig, GraphQLInt } from "graphql"
import { pageable } from "relay-cursor-paging"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { connectionWithCursorInfo } from "../fields/pagination"
import { ConversationMessageTemplateType } from "./conversationMessageTemplate"
import { ResolverContext } from "types/graphql"
import { paginationResolver } from "../fields/pagination"

export const ConversationMessageTemplatesConnectionType = connectionWithCursorInfo(
  {
    name: "ConversationMessageTemplate",
    nodeType: ConversationMessageTemplateType,
  }
).connectionType

export const ConversationMessageTemplatesConnection: GraphQLFieldConfig<
  any,
  ResolverContext
> = {
  type: ConversationMessageTemplatesConnectionType,
  description:
    "A connection of conversation message templates for this partner",
  args: pageable({
    page: { type: GraphQLInt },
  }),
  resolve: async (
    { id },
    args,
    { conversationMessageTemplatesLoader }
  ): Promise<any> => {
    if (!conversationMessageTemplatesLoader) {
      throw new Error(
        "You need to pass a X-Access-Token header to perform this action"
      )
    }

    const { page, size, offset } = convertConnectionArgsToGravityArgs(args)

    const { body, headers } = await conversationMessageTemplatesLoader({
      partner_id: id,
      page,
      size,
      total_count: true,
    })

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
}
