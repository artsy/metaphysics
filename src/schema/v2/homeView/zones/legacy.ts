import { ResolverContext } from "types/graphql"
import {
  Auctions,
  AuctionLotsForYou,
  CuratorsPicksEmerging,
  FeaturedFairs,
  HeroUnits,
  HomeViewSection,
  LatestActivity,
  LatestArticles,
  LatestAuctionResults,
  MarketingCollections,
  NewWorksForYou,
  NewWorksFromGalleriesYouFollow,
  News,
  RecentlyViewedArtworks,
  RecommendedArtists,
  ShowsForYou,
  SimilarToRecentlyViewedArtworks,
  TrendingArtists,
  ViewingRooms,
  RecommendedArtworks,
  ActiveBids,
  GalleriesNearYou,
} from "schema/v2/homeView/sections"

const LEGACY_ZONE_SECTIONS: HomeViewSection[] = [
  LatestActivity,
  NewWorksForYou,
  HeroUnits,
  ActiveBids,
  AuctionLotsForYou,
  Auctions,
  LatestAuctionResults,
  GalleriesNearYou,
  LatestArticles,
  News,
  CuratorsPicksEmerging,
  MarketingCollections,
  RecommendedArtworks,
  NewWorksFromGalleriesYouFollow,
  RecommendedArtists,
  TrendingArtists,
  RecentlyViewedArtworks,
  SimilarToRecentlyViewedArtworks,
  ViewingRooms,
  ShowsForYou,
  FeaturedFairs,
]

export async function getLegacyZoneSections(context: ResolverContext) {
  const isAuthenticatedUser = !!context.accessToken

  const displayableSections = LEGACY_ZONE_SECTIONS.reduce(
    (sections, section) => {
      const isDisplayable =
        section.requiresAuthentication === false || // public content, or
        (section.requiresAuthentication && isAuthenticatedUser) // user-specific content

      if (isDisplayable) sections.push(section)
      return sections
    },
    [] as HomeViewSection[]
  )

  return displayableSections
}
