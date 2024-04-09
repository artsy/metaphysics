import { GraphQLFieldConfig, GraphQLInt, GraphQLString } from "graphql"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { pageable } from "relay-cursor-paging"
import { ResolverContext } from "types/graphql"
import { paginationResolver } from "../fields/pagination"
import {
  UserInterestConnection,
  userInterestCategoryEnum,
  userInterestInterestTypeEnum,
} from "../userInterests"

export const UserInterestsConnection: GraphQLFieldConfig<
  void,
  ResolverContext
> = {
  type: UserInterestConnection,
  args: pageable({
    page: { type: GraphQLInt },
    size: { type: GraphQLInt },
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
    interestID: {
      type: GraphQLString,
      description:
        "Id of the user interests to return if found. Can be an 'Artist' Id or a 'Gene' Id",
    },
  }),
  resolve: async (_, args, { meUserInterestsLoader, userID }) => {
    if (!meUserInterestsLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    const { page, size, offset } = convertConnectionArgsToGravityArgs(args)

    const { body, headers } = await meUserInterestsLoader({
      category: args.category,
      interest_type: args.interestType,
      interest_id: args.interestID,
      page,
      size,
      total_count: true,
      ...(userID && { user_id: userID }),
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
