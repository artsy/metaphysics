import { GraphQLFieldResolver } from "graphql"
import { ResolverContext } from "types/graphql"
import { connectionFromArray } from "graphql-relay"
import { HomePageMarketingCollectionsModuleType } from "../home/home_page_marketing_collections_module"

export const MarketingCollectionsResolver: GraphQLFieldResolver<
  any,
  ResolverContext
> = async (parent, args, context, info) => {
  const {
    results: resolver,
  } = HomePageMarketingCollectionsModuleType.getFields()

  if (!resolver?.resolve) {
    return []
  }

  const result = await resolver.resolve(parent, args, context, info)

  return connectionFromArray(result, args)
}
