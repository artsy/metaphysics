import { ResolverContext } from "types/graphql"
import {
  AuctionLotsForYou,
  featuredCollection,
  HeroUnits,
  HomeViewSectionOrResolver,
  NewWorksForYou,
  NewWorksFromGalleriesYouFollow,
  RecentlyViewedArtworks,
  RecommendedArtists,
  SimilarToRecentlyViewedArtworks,
  TrendingArtists,
} from "./sections"

export async function getSectionsForUser(
  context: ResolverContext
): Promise<HomeViewSectionOrResolver[]> {
  /*
   * FAKE temporary placeholder logic for determining the sections that a user will see
   */
  const { meLoader } = context.authenticatedLoaders

  if (!meLoader) throw new Error("You must be signed in to see this content.")

  const me = await meLoader()

  let sections: HomeViewSectionOrResolver[] = []

  if (me.type === "Admin") {
    sections = [
      featuredCollection(
        "curators-picks-emerging-app",
        "curators-picks-emerging"
      ),
      RecentlyViewedArtworks,
      TrendingArtists,
      SimilarToRecentlyViewedArtworks,
      AuctionLotsForYou,
      NewWorksForYou,
      HeroUnits,
      NewWorksFromGalleriesYouFollow,
      RecommendedArtists,
    ]
  } else {
    sections = [
      featuredCollection(
        "curators-picks-emerging-app",
        "curators-picks-emerging"
      ),
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
