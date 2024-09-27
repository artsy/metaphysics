import { ResolverContext } from "types/graphql"
import { HomeViewSection } from "schema/v2/homeView/sections"
import { GalleriesNearYou } from "../sections/GalleriesNearYou"
import { Auctions } from "../sections/Auctions"
import { LatestArticles } from "../sections/LatestArticles"
import { News } from "../sections/News"
import { LatestAuctionResults } from "../sections/LatestAuctionResults"
import { LatestActivity } from "../sections/LatestActivity"
import { ViewingRooms } from "../sections/ViewingRooms"
import { ShowsForYou } from "../sections/ShowsForYou"
import { MarketingCollections } from "../sections/MarketingCollections"
import { FeaturedFairs } from "../sections/FeaturedFairs"
import { HeroUnits } from "../sections/HeroUnits"
import { RecommendedArtists } from "../sections/RecommendedArtists"
import { TrendingArtists } from "../sections/TrendingArtists"
import { ActiveBids } from "../sections/ActiveBids"
import { RecommendedArtworks } from "../sections/RecommendedArtworks"
import { NewWorksFromGalleriesYouFollow } from "../sections/NewWorksFromGalleriesYouFollow"
import { NewWorksForYou } from "../sections/NewWorksForYou"
import { AuctionLotsForYou } from "../sections/AuctionLotsForYou"
import { RecentlyViewedArtworks } from "../sections/RecentlyViewedArtworks"
import { CuratorsPicksEmerging } from "../sections/CuratorsPicksEmerging"
import { SimilarToRecentlyViewedArtworks } from "../sections/SimilarToRecentlyViewedArtworks"
import { isSectionDisplayable } from "../helpers/isSectionDisplayable"
import { DiscoverMarketingCollections } from "../sections/DiscoverMarketingCollections"
import { ExploreBy } from "../sections/ExploreBy"

const SECTIONS: HomeViewSection[] = [
  LatestActivity,
  NewWorksForYou,
  HeroUnits,
  ExploreBy,
  ActiveBids,
  AuctionLotsForYou,
  Auctions,
  DiscoverMarketingCollections,
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

/**
 * Assemble the list of sections that can be displayed
 */
export async function getSections(context: ResolverContext) {
  const displayableSections: HomeViewSection[] = []

  SECTIONS.forEach((section) => {
    if (isSectionDisplayable(section, context)) {
      displayableSections.push(section)
    }
  })

  return displayableSections
}
