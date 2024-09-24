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

/**
 * Assemble the list of sections that can be displayed
 */
export async function getLegacyZoneSections(context: ResolverContext) {
  const displayableSections: HomeViewSection[] = []

  LEGACY_ZONE_SECTIONS.forEach((section) => {
    if (isDisplayable(section, context)) {
      displayableSections.push(section)
    }
  })

  return displayableSections
}

/**
 * Determine if an individual section can displayed, consdering the current
 * context, session, feature flags, etc.
 */
function isDisplayable(section: HomeViewSection, context: ResolverContext) {
  // public content
  const isPublicSection = section.requiresAuthentication === false

  // personalized content
  const isAuthenticatedUser = !!context.accessToken
  const isValidPersonalizedSection =
    section.requiresAuthentication && isAuthenticatedUser

  // feature flagged sections
  // TKTK

  return isPublicSection || isValidPersonalizedSection
}
