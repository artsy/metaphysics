import { HomeViewSection } from "schema/v2/homeView/sections"
import { ResolverContext } from "types/graphql"
import { isSectionDisplayable } from "../helpers/isSectionDisplayable"
import { ActiveBids } from "../sections/ActiveBids"
import { AuctionLotsForYou } from "../sections/AuctionLotsForYou"
import { Auctions } from "../sections/Auctions"
import { CuratorsPicksEmerging } from "../sections/CuratorsPicksEmerging"
import { DiscoverSomethingNew } from "../sections/DiscoverSomethingNew"
import { ExploreByCategory } from "../sections/ExploreByCategory"
import { FeaturedFairs } from "../sections/FeaturedFairs"
import { GalleriesNearYou } from "../sections/GalleriesNearYou"
import { HeroUnits } from "../sections/HeroUnits"
import { LatestActivity } from "../sections/LatestActivity"
import { LatestArticles } from "../sections/LatestArticles"
import { LatestAuctionResults } from "../sections/LatestAuctionResults"
import { News } from "../sections/News"
import { NewWorksForYou } from "../sections/NewWorksForYou"
import { NewWorksFromGalleriesYouFollow } from "../sections/NewWorksFromGalleriesYouFollow"
import { RecentlyViewedArtworks } from "../sections/RecentlyViewedArtworks"
import { RecommendedArtists } from "../sections/RecommendedArtists"
import { RecommendedArtworks } from "../sections/RecommendedArtworks"
import { ShowsForYou } from "../sections/ShowsForYou"
import { SimilarToRecentlyViewedArtworks } from "../sections/SimilarToRecentlyViewedArtworks"
import { Tasks } from "../sections/Tasks"
import { TrendingArtists } from "../sections/TrendingArtists"
import { ViewingRooms } from "../sections/ViewingRooms"

const SECTIONS: HomeViewSection[] = [
  Tasks,
  LatestActivity,
  NewWorksForYou,
  RecentlyViewedArtworks,
  DiscoverSomethingNew,
  RecommendedArtworks,
  CuratorsPicksEmerging,
  ExploreByCategory,
  HeroUnits,
  ActiveBids,
  AuctionLotsForYou,
  Auctions,
  LatestAuctionResults,
  GalleriesNearYou,
  LatestArticles,
  News,
  NewWorksFromGalleriesYouFollow,
  RecommendedArtists,
  TrendingArtists,
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
