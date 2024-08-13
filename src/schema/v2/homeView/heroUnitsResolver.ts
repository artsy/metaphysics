import { GraphQLFieldResolver } from "graphql"
import { ResolverContext } from "types/graphql"
import { heroUnitsConnection } from "../HeroUnit/heroUnitsConnection"

export const HeroUnitsResolver: GraphQLFieldResolver<
  any,
  ResolverContext
> = async (parent, args, context, info) => {
  const result = await heroUnitsConnection.resolve!(parent, args, context, info)

  return result
}
