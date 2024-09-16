import { GraphQLFieldResolver } from "graphql"
import { ResolverContext } from "types/graphql"
import { FeaturedFairsResolver } from "../resolvers/featuredFairsResolver"
import {
  LatestArticlesResolvers,
  NewsResolver,
} from "../resolvers/articlesResolvers"
import { MarketingCollectionsResolver } from "../resolvers/marketingCollectionsResolvers"
import { LatestActivityResolver } from "../resolvers/activityResolvers"
import { LatestAuctionResultsResolver } from "../resolvers/auctionResultsResolvers"
import { HomeViewComponentBehaviors } from "../HomeViewComponent"
import { SalesResolver } from "../resolvers/salesResolvers"
import { withHomeViewTimeout } from "../helpers/withHomeViewTimeout"
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

/**
 * Fairs Sections
 */

export const FeaturedFairs: HomeViewSection = {
  id: "home-view-section-featured-fairs",
  type: HomeViewSectionTypeNames.HomeViewSectionFairs,
  contextModule: ContextModule.fairRail,
  component: {
    title: "Featured Fairs",
    description: "See Works in Top Art Fairs",
  },
  requiresAuthentication: false,
  resolver: withHomeViewTimeout(FeaturedFairsResolver),
}

export const MarketingCollections: HomeViewSection = {
  id: "home-view-section-marketing-collections",
  type: HomeViewSectionTypeNames.HomeViewSectionMarketingCollections,
  contextModule: ContextModule.collectionRail,
  component: {
    title: "Collections",
  },
  requiresAuthentication: false,
  resolver: withHomeViewTimeout(MarketingCollectionsResolver),
}

/**
 * Shows Sections
 */

export const ShowsForYou: HomeViewSection = {
  id: "home-view-section-shows-for-you",
  type: HomeViewSectionTypeNames.HomeViewSectionShows,
  contextModule: ContextModule.showsRail,
  component: {
    title: "Shows for You",
  },
  requiresAuthentication: true,
}

/**
 * Viewing Rooms Sections
 */

export const ViewingRooms: HomeViewSection = {
  id: "home-view-section-viewing-rooms",
  type: HomeViewSectionTypeNames.HomeViewSectionViewingRooms,
  contextModule: ContextModule.featuredViewingRoomsRail,
  component: {
    title: "Viewing Rooms",
    behaviors: {
      viewAll: {
        href: "/viewing-rooms",
        ownerType: OwnerType.viewingRooms,
      },
    },
  },
  requiresAuthentication: false,
}

/**
 * Activity Sections
 */

export const LatestActivity: HomeViewSection = {
  id: "home-view-section-latest-activity",
  type: HomeViewSectionTypeNames.HomeViewSectionActivity,
  contextModule: ContextModule.activityRail,
  component: {
    title: "Latest Activity",
    behaviors: {
      viewAll: {
        buttonText: "See All",
        href: "/notifications",
        ownerType: OwnerType.activities,
      },
    },
  },
  requiresAuthentication: true,
  resolver: withHomeViewTimeout(LatestActivityResolver),
}

/**
 * Auction Results Sections
 */

export const LatestAuctionResults: HomeViewSection = {
  id: "home-view-section-latest-auction-results",
  type: HomeViewSectionTypeNames.HomeViewSectionAuctionResults,
  contextModule: ContextModule.auctionResultsRail,
  component: {
    title: "Latest Auction Results",
    behaviors: {
      viewAll: {
        buttonText: "Browse All Results",
      },
    },
  },
  requiresAuthentication: true,
  resolver: withHomeViewTimeout(LatestAuctionResultsResolver),
}

/**
 * Articles Sections
 */

export const News: HomeViewSection = {
  id: "home-view-section-news",
  type: HomeViewSectionTypeNames.HomeViewSectionArticles,
  // TODO: This should be differentiated from the Artsy Editorial rail
  contextModule: ContextModule.articleRail,
  component: {
    title: "News",
    type: "ArticlesCard",
    behaviors: {
      viewAll: {
        buttonText: "More in News",
        href: "/news",
        ownerType: "marketNews" as OwnerType,
      },
    },
  },
  requiresAuthentication: false,
  resolver: withHomeViewTimeout(NewsResolver),
}

export const LatestArticles: HomeViewSection = {
  id: "home-view-section-latest-articles",
  type: HomeViewSectionTypeNames.HomeViewSectionArticles,
  contextModule: ContextModule.articleRail,
  component: {
    title: "Artsy Editorial",
    behaviors: {
      viewAll: {
        href: "/articles",
        ownerType: OwnerType.articles,
      },
    },
  },
  requiresAuthentication: false,
  resolver: withHomeViewTimeout(LatestArticlesResolvers),
}

/**
 * Auctions Sections
 */

export const Auctions: HomeViewSection = {
  id: "home-view-section-auctions",
  type: HomeViewSectionTypeNames.HomeViewSectionSales,
  contextModule: ContextModule.auctionRail,
  component: {
    title: "Auctions",
    behaviors: {
      viewAll: {
        buttonText: "Browse All Auctions",
        href: "/auctions",
        ownerType: OwnerType.auctions,
      },
    },
  },
  requiresAuthentication: false,
  resolver: withHomeViewTimeout(SalesResolver),
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
