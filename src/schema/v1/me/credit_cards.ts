import { CreditCardConnection } from "schema/v1/credit_card"
import { pageable } from "relay-cursor-paging"
import { connectionFromArraySlice } from "graphql-relay"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { GraphQLFieldConfig } from "graphql/type"
import { ResolverContext } from "types/graphql"

export const CreditCards: GraphQLFieldConfig<void, ResolverContext> = {
  type: CreditCardConnection,
  args: pageable({}),
  description: "A list of the current user’s credit cards",
  resolve: (_root, options, { meCreditCardsLoader }) => {
    if (!meCreditCardsLoader) return null
    const { page, size, offset } = convertConnectionArgsToGravityArgs(options)
    const gravityArgs = { page, size, total_count: true }

    return meCreditCardsLoader(gravityArgs).then(({ body, headers }) => {
      return connectionFromArraySlice(body, options, {
        arrayLength: parseInt(headers["x-total-count"] || "0", 10),
        sliceStart: offset,
      })
    })
  },
}
