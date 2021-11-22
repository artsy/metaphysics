import Gene from "schema/v2/gene"
import { InternalIDFields } from "schema/v2/object_identification"
import { pageable } from "relay-cursor-paging"
import { GraphQLObjectType, GraphQLFieldConfig, GraphQLInt } from "graphql"
import { ResolverContext } from "types/graphql"
import {
  connectionWithCursorInfo,
  paginationResolver,
} from "../fields/pagination"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"

export const FollowGeneType = new GraphQLObjectType<any, ResolverContext>({
  name: "FollowGene",
  fields: {
    gene: {
      type: Gene.type,
    },
    ...InternalIDFields,
  },
})

const FollowedGenes: GraphQLFieldConfig<void, ResolverContext> = {
  type: connectionWithCursorInfo({ nodeType: FollowGeneType }).connectionType,
  args: pageable({
    page: { type: GraphQLInt },
    size: { type: GraphQLInt },
  }),
  description: "A list of the current user’s inquiry requests",
  resolve: async (_root, args, { followedGenesLoader }) => {
    if (!followedGenesLoader) return null

    const { page, size, offset } = convertConnectionArgsToGravityArgs(args)

    const { body, headers } = await followedGenesLoader({
      size,
      offset,
      total_count: true,
    })

    const totalCount = parseInt(headers["x-total-count"] || "0", 10)

    return paginationResolver({ totalCount, offset, page, size, body, args })
  },
}

export default FollowedGenes
