import { connectionWithCursorInfo } from "../fields/pagination"
import { HeroUnitType } from "./HeroUnitType"
import { GraphQLBoolean, GraphQLString, GraphQLFieldConfig } from "graphql"
import { ResolverContext } from "types/graphql"
import { pageable } from "relay-cursor-paging"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { paginationResolver } from "schema/v2/fields/pagination"

export const tokenRequiredMesage =
  "You need to pass a X-Access-Token header to perform this action"

export const invalidArgsMessage =
  "Invalid arguments - can't have both showAll and term"

export const pickLoader = (args, context) => {
  const { showAll, term } = args

  if (showAll && term) throw new Error(invalidArgsMessage)

  const {
    authenticatedHeroUnitsLoader,
    heroUnitsLoader,
    matchHeroUnitsLoader,
  } = context

  if (term && !matchHeroUnitsLoader) throw new Error(tokenRequiredMesage)

  const loader =
    (term && matchHeroUnitsLoader) ||
    (showAll && authenticatedHeroUnitsLoader) ||
    heroUnitsLoader

  return loader
}

const HeroUnitConnection = connectionWithCursorInfo({
  nodeType: HeroUnitType,
})

export const heroUnitsConnection: GraphQLFieldConfig<void, ResolverContext> = {
  type: HeroUnitConnection.connectionType,
  args: pageable({
    showAll: {
      type: GraphQLBoolean,
      description: "If true will all hero units.",
      defaultValue: false,
    },
    term: {
      type: GraphQLString,
      description: "If present, will search by term.",
    },
  }),
  resolve: async (_root, args, context) => {
    const { term } = args

    const loader = pickLoader(args, context)

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
