import { connectionWithCursorInfo } from "../fields/pagination"
import { HeroUnitType } from "./HeroUnitType"
import { GraphQLString, GraphQLFieldConfig } from "graphql"
import { ResolverContext } from "types/graphql"
import { pageable } from "relay-cursor-paging"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { paginationResolver } from "schema/v2/fields/pagination"

const HeroUnitConnection = connectionWithCursorInfo({
  nodeType: HeroUnitType,
})

export const heroUnitsConnection: GraphQLFieldConfig<void, ResolverContext> = {
  type: HeroUnitConnection.connectionType,
  args: pageable({
    term: {
      type: GraphQLString,
      description: "If present, will search by term",
    },
  }),
  resolve: async (_root, args, context) => {
    const {
      authenticatedHeroUnitsLoader,
      heroUnitsLoader,
      matchHeroUnitsLoader,
    } = context

    const { term } = args

    if (term && !matchHeroUnitsLoader)
      throw new Error(
        "You need to pass a X-Access-Token header to perform this action"
      )

    const loader =
      (term && matchHeroUnitsLoader) ||
      (authenticatedHeroUnitsLoader ?? heroUnitsLoader)

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
      ...(term ? { term } : {}),
    }

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