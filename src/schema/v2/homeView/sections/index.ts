import { GraphQLFieldResolver } from "graphql"
import { ResolverContext } from "types/graphql"
import {
  ActiveBidsResolver,
  AuctionLotsForYouResolver,
  CuratorsPicksEmergingArtworksResolver,
  NewWorksForYouResolver,
  NewWorksFromGalleriesYouFollowResolver,
  RecentlyViewedArtworksResolver,
  RecommendedArtworksResolver,
  SimilarToRecentlyViewedArtworksResolver,
} from "../resolvers/artworkResolvers"
import {
  RecommendedArtistsResolver,
  SuggestedArtistsResolver,
} from "../resolvers/artistResolvers"
import { HeroUnitsResolver } from "../resolvers/heroUnitsResolvers"
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
 * Artworks Section
 */

export const SimilarToRecentlyViewedArtworks: HomeViewSection = {
  id: "home-view-section-similar-to-recently-viewed-artworks",
  type: HomeViewSectionTypeNames.HomeViewSectionArtworks,
  contextModule: ContextModule.similarToWorksYouViewedRail,
  component: {
    title: "Similar to Works You’ve Viewed",
    behaviors: {
      viewAll: {
        buttonText: "Browse All Artworks",
      },
    },
  },
  requiresAuthentication: true,
  resolver: withHomeViewTimeout(SimilarToRecentlyViewedArtworksResolver),
}

export const CuratorsPicksEmerging: HomeViewSection = {
  id: "home-view-section-curators-picks-emerging",
  type: HomeViewSectionTypeNames.HomeViewSectionArtworks,
  contextModule: ContextModule.curatorsPicksEmergingRail,
  component: {
    type: "FeaturedCollection",
    title: async (context: ResolverContext) => {
      const { app_title } = await context.siteHeroUnitLoader(
        "curators-picks-emerging-app"
      )
      return app_title
    },
    description: async (context: ResolverContext) => {
      const { app_description } = await context.siteHeroUnitLoader(
        "curators-picks-emerging-app"
      )
      return app_description
    },
    backgroundImageURL: async (context: ResolverContext, args) => {
      const {
        background_image_app_phone_url,
        background_image_app_tablet_url,
      } = await context.siteHeroUnitLoader("curators-picks-emerging-app")

      if (args.version === "wide") {
        return background_image_app_tablet_url
      }

      return background_image_app_phone_url
    },
    behaviors: {
      viewAll: {
        href: "/collection/curators-picks-emerging",
        buttonText: "Browse All Artworks",
        ownerType: OwnerType.collection,
      },
    },
  },
  requiresAuthentication: false,
  resolver: withHomeViewTimeout(CuratorsPicksEmergingArtworksResolver),
}

export const RecentlyViewedArtworks: HomeViewSection = {
  id: "home-view-section-recently-viewed-artworks",
  type: HomeViewSectionTypeNames.HomeViewSectionArtworks,
  contextModule: ContextModule.recentlyViewedRail,
  component: {
    title: "Recently Viewed",
    behaviors: {
      viewAll: {
        buttonText: "Browse All Artworks",
      },
    },
  },
  requiresAuthentication: true,
  resolver: withHomeViewTimeout(RecentlyViewedArtworksResolver),
}

export const AuctionLotsForYou: HomeViewSection = {
  id: "home-view-section-auction-lots-for-you",
  type: HomeViewSectionTypeNames.HomeViewSectionArtworks,
  contextModule: ContextModule.lotsForYouRail,
  component: {
    title: "Auction lots for You",
    behaviors: {
      viewAll: {
        href: "/auctions/lots-for-you-ending-soon",
        buttonText: "Browse All Artworks",
        ownerType: OwnerType.lotsForYou,
      },
    },
  },
  requiresAuthentication: true,
  resolver: withHomeViewTimeout(AuctionLotsForYouResolver),
}

export const NewWorksForYou: HomeViewSection = {
  id: "home-view-section-new-works-for-you",
  type: HomeViewSectionTypeNames.HomeViewSectionArtworks,
  contextModule: ContextModule.newWorksForYouRail,
  component: {
    title: "New works for You",
    behaviors: {
      viewAll: {
        buttonText: "Browse All Artworks",
      },
    },
  },
  requiresAuthentication: true,
  resolver: withHomeViewTimeout(NewWorksForYouResolver),
}

export const NewWorksFromGalleriesYouFollow: HomeViewSection = {
  id: "home-view-section-new-works-from-galleries-you-follow",
  type: HomeViewSectionTypeNames.HomeViewSectionArtworks,
  contextModule: ContextModule.newWorksByGalleriesYouFollowRail,
  component: {
    title: "New Works from Galleries You Follow",
    behaviors: {
      viewAll: {
        buttonText: "Browse All Artworks",
      },
    },
  },
  requiresAuthentication: true,
  resolver: withHomeViewTimeout(NewWorksFromGalleriesYouFollowResolver),
}

export const RecommendedArtworks: HomeViewSection = {
  id: "home-view-section-recommended-artworks",
  type: HomeViewSectionTypeNames.HomeViewSectionArtworks,
  contextModule: ContextModule.recommendedArtistsRail,
  component: {
    title: "Artwork Recommendations",
    behaviors: {
      viewAll: {
        buttonText: "Browse All Artworks",
      },
    },
  },
  requiresAuthentication: true,
  resolver: withHomeViewTimeout(RecommendedArtworksResolver),
}

export const ActiveBids: HomeViewSection = {
  id: "home-view-section-active-bids",
  type: HomeViewSectionTypeNames.HomeViewSectionArtworks,
  contextModule: ContextModule.yourActiveBids,
  component: {
    title: "Your Active Bids",
  },
  requiresAuthentication: true,
  resolver: withHomeViewTimeout(ActiveBidsResolver),
}

/**
 * Artists Section
 */

export const TrendingArtists: HomeViewSection = {
  id: "home-view-section-trending-artists",
  type: HomeViewSectionTypeNames.HomeViewSectionArtists,
  contextModule: ContextModule.trendingArtistsRail,
  component: {
    title: "Trending Artists",
  },
  requiresAuthentication: false,
  resolver: withHomeViewTimeout(SuggestedArtistsResolver),
}

export const RecommendedArtists: HomeViewSection = {
  id: "home-view-section-recommended-artists",
  type: HomeViewSectionTypeNames.HomeViewSectionArtists,
  contextModule: ContextModule.recommendedArtistsRail,
  component: {
    title: "Recommended Artists",
  },
  requiresAuthentication: true,
  resolver: withHomeViewTimeout(RecommendedArtistsResolver),
}

/**
 * Hero Units Sections
 */

export const HeroUnits: HomeViewSection = {
  id: "home-view-section-hero-units",
  type: HomeViewSectionTypeNames.HomeViewSectionHeroUnits,
  contextModule: ContextModule.heroUnitsRail,
  requiresAuthentication: false,
  resolver: withHomeViewTimeout(HeroUnitsResolver),
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
