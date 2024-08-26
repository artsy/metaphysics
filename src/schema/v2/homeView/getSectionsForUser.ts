import { ResolverContext } from "types/graphql"
import {
  LatestActivity,
  AuctionLotsForYou,
  CuratorsPicksEmerging,
  FeaturedFairs,
  HeroUnits,
  HomeViewSection,
  LatestArticles,
  MarketingCollections,
  NewWorksForYou,
  NewWorksFromGalleriesYouFollow,
  RecentlyViewedArtworks,
  RecommendedArtists,
  ShowsForYou,
  SimilarToRecentlyViewedArtworks,
  TrendingArtists,
  ViewingRooms,
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
      LatestActivity,
      LatestArticles,
      RecentlyViewedArtworks,
      ShowsForYou,
      MarketingCollections,
      TrendingArtists,
      FeaturedFairs,
      CuratorsPicksEmerging,
      SimilarToRecentlyViewedArtworks,
      AuctionLotsForYou,
      NewWorksForYou,
      HeroUnits,
      NewWorksFromGalleriesYouFollow,
      RecommendedArtists,
      ViewingRooms,
    ]
  } else {
    sections = [
      LatestActivity,
      CuratorsPicksEmerging,
      SimilarToRecentlyViewedArtworks,
      ShowsForYou,
      MarketingCollections,
      FeaturedFairs,
      NewWorksForYou,
      HeroUnits,
      AuctionLotsForYou,
      LatestArticles,
      RecommendedArtists,
      TrendingArtists,
      NewWorksFromGalleriesYouFollow,
      RecentlyViewedArtworks,
      ViewingRooms,
    ]
  }

  return sections
}
