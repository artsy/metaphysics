import { GraphQLFieldResolver } from "graphql"
import { ResolverContext } from "types/graphql"
import { HomePageFairsModuleType } from "../home/home_page_fairs_module"
import { connectionFromArray } from "graphql-relay"

export const FeaturedFairsResolver: GraphQLFieldResolver<
  any,
  ResolverContext
> = async (parent, args, context, info) => {
  const { results: resolver } = HomePageFairsModuleType.getFields()

  if (!resolver?.resolve) {
    return []
  }

  const result = await resolver.resolve(parent, args, context, info)

  return connectionFromArray(result, args)
}
