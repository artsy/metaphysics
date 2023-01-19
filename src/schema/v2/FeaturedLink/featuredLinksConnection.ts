import { GraphQLFieldConfig, GraphQLString } from "graphql"
import { ResolverContext } from "types/graphql"
import { paginationResolver } from "schema/v2/fields/pagination"
import { pageable } from "relay-cursor-paging"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { FeaturedLinkConnectionType } from "./featuredLink"

export const FeaturedLinksConnection: GraphQLFieldConfig<
  void,
  ResolverContext
> = {
  type: FeaturedLinkConnectionType,
  args: pageable({
    term: {
      type: GraphQLString,
      description: "If present, will search by term",
    },
  }),
  resolve: async (
    _root,
    args,
    { featuredLinksLoader, matchFeaturedLinksLoader }
  ) => {
    if (!matchFeaturedLinksLoader || !featuredLinksLoader)
      throw new Error(
        "You need to pass a X-Access-Token header to perform this action"
      )

    const { term } = args
    const { page, size, offset } = convertConnectionArgsToGravityArgs(args)

    const gravityArgs: {
      page: number
      size: number
      total_count: boolean
      term?: string
    } = {
      page,
      size,
      total_count: true,
    }

    if (term) gravityArgs.term = term

    const loader = term ? matchFeaturedLinksLoader : featuredLinksLoader

    const { body, headers } = await loader(gravityArgs)

    const totalCount = parseInt(headers["x-total-count"] || "0", 10)

    return paginationResolver({
      args,
      body,
      offset,
      page,
      size,
      totalCount,
    })
  },
}
