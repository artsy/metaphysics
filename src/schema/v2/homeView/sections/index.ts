import { GraphQLFieldResolver } from "graphql"
import { ResolverContext } from "types/graphql"
import { HomeViewComponentBehaviors } from "../HomeViewComponent"
import { HomeViewSectionTypeNames } from "../HomeViewSection"
import { ContextModule, OwnerType } from "@artsy/cohesion"
import { SimilarToRecentlyViewedArtworks } from "./SimilarToRecentlyViewedArtworks"
import { CuratorsPicksEmerging } from "./CuratorsPicksEmerging"
import { RecentlyViewedArtworks } from "./RecentlyViewedArtworks"
import { AuctionLotsForYou } from "./AuctionLotsForYou"
import { NewWorksForYou } from "./NewWorksForYou"
import { NewWorksFromGalleriesYouFollow } from "./NewWorksFromGalleriesYouFollow"
import { RecommendedArtworks } from "./RecommendedArtworks"
import { ActiveBids } from "./ActiveBids"
import { TrendingArtists } from "./TrendingArtists"
import { RecommendedArtists } from "./RecommendedArtists"
import { HeroUnits } from "./HeroUnits"
import { FeaturedFairs } from "./FeaturedFairs"
import { MarketingCollections } from "./MarketingCollections"
import { ShowsForYou } from "./ShowsForYou"
import { ViewingRooms } from "./ViewingRooms"
import { LatestActivity } from "./LatestActivity"
import { LatestAuctionResults } from "./LatestAuctionResults"
import { News } from "./News"
import { LatestArticles } from "./LatestArticles"
import { Auctions } from "./Auctions"
import { GalleriesNearYou } from "./GalleriesNearYou"
import { FeatureFlag } from "lib/featureFlags"
import { DiscoverMarketingCollections } from "./DiscoverMarketingCollections"
import { ExploreBy } from "./ExploreBy"

type MaybeResolved<T> =
  | T
  | ((context: ResolverContext, args: any) => Promise<T>)

export type HomeViewSection = {
  id: string
  contextModule?: ContextModule
  featureFlag?: FeatureFlag
  component?: {
    title?: MaybeResolved<string>
    type?: string
    description?: MaybeResolved<string>
    backgroundImageURL?: MaybeResolved<string>
    behaviors?: HomeViewComponentBehaviors
  }
  ownerType?: OwnerType
  requiresAuthentication: boolean
  shouldBeDisplayed?: (context: ResolverContext) => boolean
  resolver?: GraphQLFieldResolver<any, ResolverContext>
  type: keyof typeof HomeViewSectionTypeNames
}

const sections: HomeViewSection[] = [
  ActiveBids,
  AuctionLotsForYou,
  Auctions,
  CuratorsPicksEmerging,
  DiscoverMarketingCollections,
  FeaturedFairs,
  GalleriesNearYou,
  HeroUnits,
  ExploreBy,
  LatestActivity,
  LatestArticles,
  LatestAuctionResults,
  MarketingCollections,
  MarketingCollections,
  MarketingCollections,
  News,
  NewWorksForYou,
  NewWorksFromGalleriesYouFollow,
  RecentlyViewedArtworks,
  RecommendedArtists,
  RecommendedArtworks,
  ShowsForYou,
  SimilarToRecentlyViewedArtworks,
  TrendingArtists,
  ViewingRooms,
]

export const registry = sections.reduce(
  (acc, section) => ({ ...acc, [section.id]: section }),
  {}
)
