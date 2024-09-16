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

type MaybeResolved<T> =
  | T
  | ((context: ResolverContext, args: any) => Promise<T>)

export type HomeViewSection = {
  id: string
  contextModule: ContextModule
  type: keyof typeof HomeViewSectionTypeNames
  component?: {
    title?: MaybeResolved<string>
    type?: string
    description?: MaybeResolved<string>
    backgroundImageURL?: MaybeResolved<string>
    behaviors?: HomeViewComponentBehaviors
  }
  requiresAuthentication: boolean
  resolver?: GraphQLFieldResolver<any, ResolverContext>
}

/*
 * Galleries Sections
 */

export const GalleriesNearYou: HomeViewSection = {
  id: "home-view-section-galleries-near-you",
  type: HomeViewSectionTypeNames.HomeViewSectionGalleries,
  contextModule: ContextModule.galleriesForYouBanner,
  component: {
    title: "Galleries Near You",
    description:
      "Follow these local galleries for updates on artists you love.",
    backgroundImageURL: "https://files.artsy.net/images/galleries_for_you.webp",
    behaviors: {
      viewAll: {
        buttonText: "Explore",
      },
    },
  },
  requiresAuthentication: false,
}

const sections: HomeViewSection[] = [
  ActiveBids,
  AuctionLotsForYou,
  Auctions,
  CuratorsPicksEmerging,
  FeaturedFairs,
  GalleriesNearYou,
  HeroUnits,
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
