import { ContextModule, OwnerType } from "@artsy/cohesion"
import { GraphQLFieldResolver } from "graphql"
import { FeatureFlag } from "lib/featureFlags"
import { ResolverContext } from "types/graphql"
import { HomeViewComponentBehaviors } from "../HomeViewComponent"
import { HomeViewSectionTypeNames } from "../sectionTypes/names"
import { ActiveBids } from "./ActiveBids"
import { AuctionLotsForYou } from "./AuctionLotsForYou"
import { Auctions } from "./Auctions"
import { CuratorsPicksEmerging } from "./CuratorsPicksEmerging"
import { DiscoverSomethingNew } from "./DiscoverSomethingNew"
import { ExploreByCategory } from "./ExploreByCategory"
import { FeaturedFairs } from "./FeaturedFairs"
import { GalleriesNearYou } from "./GalleriesNearYou"
import { HeroUnits } from "./HeroUnits"
import { LatestActivity } from "./LatestActivity"
import { LatestArticles } from "./LatestArticles"
import { LatestAuctionResults } from "./LatestAuctionResults"
import { News } from "./News"
import { NewWorksForYou } from "./NewWorksForYou"
import { NewWorksFromGalleriesYouFollow } from "./NewWorksFromGalleriesYouFollow"
import { RecentlyViewedArtworks } from "./RecentlyViewedArtworks"
import { RecommendedArtists } from "./RecommendedArtists"
import { RecommendedArtworks } from "./RecommendedArtworks"
import { ShowsForYou } from "./ShowsForYou"
import { SimilarToRecentlyViewedArtworks } from "./SimilarToRecentlyViewedArtworks"
import { Tasks } from "./Tasks"
import { TrendingArtists } from "./TrendingArtists"
import { ViewingRooms } from "./ViewingRooms"
import { InfiniteDiscovery } from "./InfiniteDiscovery"
import { SemanticVersionNumber } from "lib/semantic-versioning"

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
  minimumEigenVersion?: SemanticVersionNumber
  shouldBeDisplayed?: (context: ResolverContext) => boolean
  resolver?: GraphQLFieldResolver<any, ResolverContext>
  type: keyof typeof HomeViewSectionTypeNames
}

const sections: HomeViewSection[] = [
  ActiveBids,
  AuctionLotsForYou,
  Auctions,
  CuratorsPicksEmerging,
  DiscoverSomethingNew,
  ExploreByCategory,
  FeaturedFairs,
  GalleriesNearYou,
  HeroUnits,
  InfiniteDiscovery,
  LatestActivity,
  LatestArticles,
  LatestAuctionResults,
  News,
  NewWorksForYou,
  NewWorksFromGalleriesYouFollow,
  RecentlyViewedArtworks,
  RecommendedArtists,
  RecommendedArtworks,
  ShowsForYou,
  SimilarToRecentlyViewedArtworks,
  Tasks,
  TrendingArtists,
  ViewingRooms,
]

export const registry = sections.reduce(
  (acc, section) => ({ ...acc, [section.id]: section }),
  {}
)
