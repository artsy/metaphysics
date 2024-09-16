import type { GraphQLFieldResolver } from "graphql"
import type { ResolverContext } from "types/graphql"
import { connectionFromArray } from "graphql-relay"

export const ActiveBidsResolver: GraphQLFieldResolver<
  any,
  ResolverContext
> = async (_parent, args, context, _info) => {
  const { lotStandingLoader } = context

  if (!lotStandingLoader) return []

  let result = await lotStandingLoader({
    live: true,
  })
  result = result.map((res) => res.sale_artwork.artwork)

  return connectionFromArray(result, args)
}
