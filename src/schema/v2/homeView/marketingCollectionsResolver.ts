import { GraphQLFieldResolver } from "graphql"
import { ResolverContext } from "types/graphql"
import { connectionFromArray } from "graphql-relay"
import { HomePageMarketingCollectionsModuleType } from "../home/home_page_marketing_collections_module"

export const MarketingCollectionsResolver: GraphQLFieldResolver<
  any,
  ResolverContext
> = async (parent, args, context, info) => {
  const resolver = HomePageMarketingCollectionsModuleType.getFields().results

  if (!resolver?.resolve) {
    return []
  }

  const result = await resolver.resolve(parent, args, context, info)

  return connectionFromArray(result, args)
}
