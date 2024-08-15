import { ResolverContext } from "types/graphql"
import {
  AuctionLotsForYou,
  CuratorsPicksEmerging,
  HeroUnits,
  HomeViewSection,
  NewWorksForYou,
  NewWorksFromGalleriesYouFollow,
  RecentlyViewedArtworks,
  RecommendedArtists,
  SimilarToRecentlyViewedArtworks,
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
      SimilarToRecentlyViewedArtworks,
      AuctionLotsForYou,
      NewWorksForYou,
      HeroUnits,
      NewWorksFromGalleriesYouFollow,
      RecommendedArtists,
      CuratorsPicksEmerging,
    ]
  } else {
    sections = [
      CuratorsPicksEmerging,
      SimilarToRecentlyViewedArtworks,
      NewWorksForYou,
      HeroUnits,
      AuctionLotsForYou,
      RecommendedArtists,
      TrendingArtists,
      NewWorksFromGalleriesYouFollow,
      RecentlyViewedArtworks,
    ]
  }

  return sections
}
