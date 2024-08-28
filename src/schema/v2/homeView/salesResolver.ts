import { GraphQLFieldResolver } from "graphql"
import { ResolverContext } from "types/graphql"
import { HomePageSalesModuleType } from "../home/home_page_sales_module"
import { connectionFromArray } from "graphql-relay"

export const SalesResolver: GraphQLFieldResolver<any, ResolverContext> = async (
  parent,
  args,
  context,
  info
) => {
  const { results: resolver } = HomePageSalesModuleType.getFields()

  if (!resolver?.resolve) {
    return []
  }

  const result = await resolver.resolve(parent, args, context, info)

  return connectionFromArray(result, args)
}
