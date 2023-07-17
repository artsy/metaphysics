import { GraphQLFieldConfig, GraphQLString } from "graphql"
import { ResolverContext } from "types/graphql"
import { userInterestType } from "../userInterests"

export const UserInterest: GraphQLFieldConfig<any, ResolverContext> = {
  type: userInterestType,
  args: {
    id: {
      type: GraphQLString,
      description: "The ID of the UserInterest",
    },
  },
  description: "Get a user interest",
  resolve: async (_, { id }, { meUserInterestLoader }) => {
    if (!meUserInterestLoader) {
      return null
    }

    return await meUserInterestLoader(id)
  },
}
