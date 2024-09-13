import { GraphQLFieldResolver } from "graphql"
import { ResolverContext } from "types/graphql"
import {
  AuctionResultSortEnum,
  AuctionResultsStateEnums,
} from "../../auction_result"
import AuctionResultsByFollowedArtists from "../../me/auctionResultsByFollowedArtists"

export const LatestAuctionResultsResolver: GraphQLFieldResolver<
  any,
  ResolverContext
> = async (parent, args, context, info) => {
  const finalArgs = {
    state: AuctionResultsStateEnums.getValue("PAST")?.value,
    sort: AuctionResultSortEnum.getValue("DATE_DESC")?.value,
    ...args,
  }

  return await AuctionResultsByFollowedArtists.resolve!(
    parent,
    finalArgs,
    context,
    info
  )
}
