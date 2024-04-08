import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { paginationResolver } from "../fields/pagination"
import { pageable } from "relay-cursor-paging"
import { saleAgreementConnectionType } from "./SaleAgreement"
import { GraphQLFieldConfig } from "graphql"
import { ResolverContext } from "types/graphql"
import { SaleAgreementStatusEnum } from "./SaleAgreementStatusEnum"

export const SaleAgreementsConnection: GraphQLFieldConfig<
  void,
  ResolverContext
> = {
  type: saleAgreementConnectionType,
  description: "The conditions of sale for Artsy or an individual sale.",
  args: pageable({
    status: {
      type: SaleAgreementStatusEnum,
      description:
        "if present, will return condition of sales with the input status",
    },
  }),

  resolve: async (_root, args, { saleAgreementsLoader }) => {
    if (!saleAgreementsLoader)
      throw new Error(
        "You need to pass a X-Access-Token header to perform this action"
      )

    const { status } = args

    const { page, size, offset } = convertConnectionArgsToGravityArgs(args)

    const gravityArgs: {
      page: number
      size: number
      total_count: boolean
      status?: string
    } = { page, size, total_count: true }

    if (status) gravityArgs.status = status

    const { body, headers } = await saleAgreementsLoader(gravityArgs)

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
