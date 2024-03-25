import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { paginationResolver } from "../fields/pagination"
import { pageable } from "relay-cursor-paging"
import { saleAgreementConnectionType } from "./saleAgreement"
import { GraphQLFieldConfig, GraphQLString } from "graphql"
import { ResolverContext } from "types/graphql"

export const SaleAgreementsConnection: GraphQLFieldConfig<
  void,
  ResolverContext
> = {
  type: saleAgreementConnectionType,
  description: "The conditions of sale for Artsy or an individual sale.",
  args: pageable({
    status: {
      type: GraphQLString,
      description:
        "if present, will return condition of sales with the input status",
    },
    term: {
      type: GraphQLString,
      description: "If present, will search by term",
    },
  }),

  resolve: async (
    _root,
    args,
    { saleAgreementsLoader, matchSaleAgreementsLoader }
  ) => {
    if (!saleAgreementsLoader || !matchSaleAgreementsLoader)
      throw new Error(
        "You need to pass a X-Access-Token header to perform this action"
      )

    const { term, status } = args

    const { page, size, offset } = convertConnectionArgsToGravityArgs(args)

    const loader = term ? matchSaleAgreementsLoader : saleAgreementsLoader
    const gravityArgs: {
      page: number
      size: number
      total_count: boolean
      term?: string
      status?: string
    } = { page, size, total_count: true }

    if (term) gravityArgs.term = term
    if (status) gravityArgs.status = status

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
