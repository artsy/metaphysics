import { HomeViewSection } from "schema/v2/homeView/sections"
import { ResolverContext } from "types/graphql"
import { DisplayableRule } from "../mixer/rules/DisplayableRule"
import { HomeViewMixer } from "../mixer/HomeViewMixer"
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
import { InfiniteDiscovery } from "../sections/InfiniteDiscovery"
import { QuickLinks } from "../sections/QuickLinks"
import { BoostHeroUnitsForNewUsersRule } from "../mixer/rules/BoostHeroUnitsForNewUsersRule"

const SECTIONS: HomeViewSection[] = [
  QuickLinks,
  Tasks,
  LatestActivity,
  NewWorksForYou,
  RecentlyViewedArtworks,
  InfiniteDiscovery,
  DiscoverSomethingNew,
  RecommendedArtworks,
  CuratorsPicksEmerging,
  ExploreByCategory,
  HeroUnits,
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
  const mixer = new HomeViewMixer([
    new DisplayableRule(),
    new BoostHeroUnitsForNewUsersRule(),
  ])

  return await mixer.mix(SECTIONS, context)
}
