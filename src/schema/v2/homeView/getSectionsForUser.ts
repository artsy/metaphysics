import { ResolverContext } from "types/graphql"
import {
  AuctionLotsForYou,
  HomeViewSection,
  NewWorksForYou,
  RecentlyViewedArtworks,
  TrendingArtists,
} from "./sections"

export async function getSectionsForUser(
  context: ResolverContext
): Promise<HomeViewSection[]> {
  /*
   * FAKE temporary placeholder logic for determining the sections that a user will see
   */
  const { meLoader } = context.authenticatedLoaders

  if (!meLoader) throw new Error("You must be signed in to see this content.")

  const me = await meLoader()

  let sections: HomeViewSection[] = []

  if (me.type === "Admin") {
    sections = [
      RecentlyViewedArtworks,
      TrendingArtists,
      AuctionLotsForYou,
      NewWorksForYou,
    ]
  } else {
    sections = [
      NewWorksForYou,
      AuctionLotsForYou,
      TrendingArtists,
      RecentlyViewedArtworks,
    ]
  }

  return sections
}
