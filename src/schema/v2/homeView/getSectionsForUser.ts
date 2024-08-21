import { ResolverContext } from "types/graphql"
import {
  AuctionLotsForYou,
  CuratorsPicksEmerging,
  FeaturedFairs,
  HeroUnits,
  HomeViewSection,
  LatestArticles,
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
      LatestArticles,
      RecentlyViewedArtworks,
      TrendingArtists,
      FeaturedFairs,
      CuratorsPicksEmerging,
      SimilarToRecentlyViewedArtworks,
      AuctionLotsForYou,
      NewWorksForYou,
      HeroUnits,
      NewWorksFromGalleriesYouFollow,
      RecommendedArtists,
    ]
  } else {
    sections = [
      CuratorsPicksEmerging,
      SimilarToRecentlyViewedArtworks,
      FeaturedFairs,
      NewWorksForYou,
      HeroUnits,
      AuctionLotsForYou,
      LatestArticles,
      RecommendedArtists,
      TrendingArtists,
      NewWorksFromGalleriesYouFollow,
      RecentlyViewedArtworks,
    ]
  }

  return sections
}
