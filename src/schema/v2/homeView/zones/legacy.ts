import { ResolverContext } from "types/graphql"
import {
  Auctions,
  HomeViewSection,
  LatestArticles,
  LatestAuctionResults,
  News,
  GalleriesNearYou,
} from "schema/v2/homeView/sections"
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
