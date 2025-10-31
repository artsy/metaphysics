import { GraphQLFieldConfig, GraphQLInt } from "graphql"
import { pageable } from "relay-cursor-paging"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { connectionWithCursorInfo } from "../fields/pagination"
import { ArtworkTemplateType } from "./artworkTemplateType"
import { ResolverContext } from "types/graphql"
import { paginationResolver } from "../fields/pagination"

export const ArtworkTemplatesConnectionType = connectionWithCursorInfo({
  name: "ArtworkTemplate",
  nodeType: ArtworkTemplateType,
}).connectionType

export const ArtworkTemplatesConnection: GraphQLFieldConfig<
  any,
  ResolverContext
> = {
  type: ArtworkTemplatesConnectionType,
  description: "A connection of artwork templates for this partner",
  args: pageable({
    page: { type: GraphQLInt },
  }),
  resolve: async (
    { id },
    args,
    { partnerArtworkTemplatesLoader }
  ): Promise<any> => {
    if (!partnerArtworkTemplatesLoader) {
      throw new Error(
        "You need to pass a X-Access-Token header to perform this action"
      )
    }

    const { page, size, offset } = convertConnectionArgsToGravityArgs(args)

    const { body, headers } = await partnerArtworkTemplatesLoader(id, {
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
