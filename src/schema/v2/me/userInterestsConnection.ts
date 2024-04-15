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
    term: {
      type: GraphQLString,
      description:
        "If present, will search by term. Will ignore page/size. This will not give accurate results if there's more than 100 user interests.",
    },
  }),
  resolve: async (_, args, { meUserInterestsLoader, userID }) => {
    if (!meUserInterestsLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    // We don't have the ability to actually search these results, so just load the first 100
    // and filter them manually.
    if (args.term) {
      const { body } = await meUserInterestsLoader({
        category: args.category,
        interest_type: args.interestType,
        interest_id: args.interestID,
        page: 1,
        size: 100,
        ...(userID && { user_id: userID }),
      })

      const results = body.filter((node) => {
        return node.interest.name
          .toLowerCase()
          .includes(args.term.toLowerCase())
      })

      return paginationResolver({
        args,
        body: results,
        offset: 0,
        page: 1,
        size: 100,
        totalCount: results.length,
        resolveNode: (node) => node.interest,
      })
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
