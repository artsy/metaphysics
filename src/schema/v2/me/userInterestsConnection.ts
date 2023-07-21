import {
  GraphQLFieldConfig,
  GraphQLList,
  GraphQLNonNull,
  GraphQLString,
} from "graphql"
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
    interestsIDs: {
      type: new GraphQLList(new GraphQLNonNull(GraphQLString)),
      description:
        "Ids of the user interests to return if found. Can be an 'Artist' Id or a 'Gene' Id",
    },
  }),
  resolve: async (_, args, { meUserInterestsLoader }) => {
    if (!meUserInterestsLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    const { page, size, offset } = convertConnectionArgsToGravityArgs(args)

    const { body, headers } = await meUserInterestsLoader({
      category: args.category,
      interest_type: args.interestType,
      interests_ids: args.interestsIDs,
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
