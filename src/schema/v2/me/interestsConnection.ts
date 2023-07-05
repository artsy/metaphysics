import { GraphQLFieldConfig, GraphQLInt } from "graphql"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { pageable } from "relay-cursor-paging"
import { ResolverContext } from "types/graphql"
import { paginationResolver } from "../fields/pagination"
import {
  UserInterestConnection,
  userInterestCategoryEnum,
  userInterestInterestTypeEnum,
} from "../userInterests"

export const InterestsConnection: GraphQLFieldConfig<void, ResolverContext> = {
  type: UserInterestConnection,
  args: pageable({
    category: {
      type: userInterestCategoryEnum,
      description:
        "UserInterest category to select. 'collected_before' or 'interested_in_collecting' category",
    },
    interestType: {
      type: userInterestInterestTypeEnum,
      description:
        "UserInterest InterestType to select. 'Artist' or 'Gene' type",
    },
    page: { type: GraphQLInt },
    size: { type: GraphQLInt },
  }),
  resolve: async (_, args, { meUserInterestsLoader }) => {
    if (!meUserInterestsLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    const { page, size, offset, ...rest } = convertConnectionArgsToGravityArgs(
      args
    )

    const gravityArgs = { ...rest, interest_type: rest.interestType }

    const { body, headers } = await meUserInterestsLoader({
      ...gravityArgs,
      page,
      size,
      total_count: true,
    })

    const totalCount = parseInt(headers["x-total-count"] || "0", 10)

    return paginationResolver({
      args,
      body,
      offset,
      page,
      size,
      totalCount,
      resolveNode: (node) => node.interest,
    })
  },
}
