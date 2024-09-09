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
} from "./artworkResolvers"
import {
  RecommendedArtistsResolver,
  SuggestedArtistsResolver,
} from "./artistResolvers"
import { HeroUnitsResolver } from "./heroUnitsResolver"
import { FeaturedFairsResolver } from "./featuredFairsResolver"
import { LatestArticlesResolvers, NewsResolver } from "./articlesResolvers"
import { MarketingCollectionsResolver } from "./marketingCollectionsResolver"
import { LatestActivityResolver } from "./activityResolvers"
import { LatestAuctionResultsResolver } from "./auctionResultsResolvers"
import { HomeViewComponentBehaviors } from "./HomeViewComponent"
import { SalesResolver } from "./salesResolver"
import { withHomeViewTimeout } from "./withHomeViewTimeout"

type MaybeResolved<T> =
  | T
  | ((context: ResolverContext, args: any) => Promise<T>)

export type HomeViewSection = {
  id: string
  type: string
  component?: {
    title?: MaybeResolved<string>
    type?: string
    description?: MaybeResolved<string>
    backgroundImageURL?: MaybeResolved<string>
    href?: MaybeResolved<string>
    behaviors?: HomeViewComponentBehaviors
  }
  requiresAuthentication: boolean
  resolver?: GraphQLFieldResolver<any, ResolverContext>
}

export const SimilarToRecentlyViewedArtworks: HomeViewSection = {
  id: "home-view-section-similar-to-recently-viewed-artworks",
  type: "ArtworksRailHomeViewSection",
  component: {
    title: "Similar to Works You’ve Viewed",
    behaviors: {
      viewAll: {
        href: "/similar-to-recently-viewed",
        buttonText: "Browse All Artworks",
      },
    },
  },
  requiresAuthentication: true,
  resolver: withHomeViewTimeout(SimilarToRecentlyViewedArtworksResolver),
}

export const CuratorsPicksEmerging: HomeViewSection = {
  id: "home-view-section-curators-picks-emerging",
  type: "ArtworksRailHomeViewSection",
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
      },
    },
    href: "/collection/curators-picks-emerging",
  },
  requiresAuthentication: false,
  resolver: withHomeViewTimeout(CuratorsPicksEmergingArtworksResolver),
}

export const RecentlyViewedArtworks: HomeViewSection = {
  id: "home-view-section-recently-viewed-artworks",
  type: "ArtworksRailHomeViewSection",
  component: {
    title: "Recently Viewed",
    behaviors: {
      viewAll: {
        href: "/recently-viewed",
        buttonText: "Browse All Artworks",
      },
    },
  },
  requiresAuthentication: true,
  resolver: withHomeViewTimeout(RecentlyViewedArtworksResolver),
}

export const AuctionLotsForYou: HomeViewSection = {
  id: "home-view-section-auction-lots-for-you",
  type: "ArtworksRailHomeViewSection",
  component: {
    title: "Auction lots for you",
    behaviors: {
      viewAll: {
        href: "/auctions/lots-for-you-ending-soon",
        buttonText: "Browse All Artworks",
      },
    },
  },
  requiresAuthentication: true,
  resolver: withHomeViewTimeout(AuctionLotsForYouResolver),
}

export const NewWorksForYou: HomeViewSection = {
  id: "home-view-section-new-works-for-you",
  type: "ArtworksRailHomeViewSection",
  component: {
    title: "New works for you",
    behaviors: {
      viewAll: {
        href: "/new-for-you",
        buttonText: "Browse All Artworks",
      },
    },
  },
  requiresAuthentication: true,
  resolver: withHomeViewTimeout(NewWorksForYouResolver),
}

export const NewWorksFromGalleriesYouFollow: HomeViewSection = {
  id: "home-view-section-new-works-from-galleries-you-follow",
  type: "ArtworksRailHomeViewSection",
  component: {
    title: "New Works from Galleries You Follow",
    behaviors: {
      viewAll: {
        href: "/new-works-from-galleries-you-follow",
        buttonText: "Browse All Artworks",
      },
    },
  },
  requiresAuthentication: true,
  resolver: withHomeViewTimeout(NewWorksFromGalleriesYouFollowResolver),
}

export const RecommendedArtworks: HomeViewSection = {
  id: "home-view-section-recommended-artworks",
  type: "ArtworksRailHomeViewSection",
  component: {
    title: "Artwork Recommendations",
    behaviors: {
      viewAll: {
        href: "/artwork-recommendations",
        buttonText: "Browse All Artworks",
      },
    },
  },
  requiresAuthentication: true,
  resolver: withHomeViewTimeout(RecommendedArtworksResolver),
}

// Artists Rails

export const TrendingArtists: HomeViewSection = {
  id: "home-view-section-trending-artists",
  type: "ArtistsRailHomeViewSection",
  component: {
    title: "Trending Artists",
  },
  requiresAuthentication: false,
  resolver: withHomeViewTimeout(SuggestedArtistsResolver),
}

export const RecommendedArtists: HomeViewSection = {
  id: "home-view-section-recommended-artists",
  type: "ArtistsRailHomeViewSection",
  component: {
    title: "Recommended Artists",
  },
  requiresAuthentication: true,
  resolver: withHomeViewTimeout(RecommendedArtistsResolver),
}

export const HeroUnits: HomeViewSection = {
  id: "home-view-section-hero-units",
  type: "HeroUnitsHomeViewSection",
  requiresAuthentication: false,
  resolver: withHomeViewTimeout(HeroUnitsResolver),
}

export const FeaturedFairs: HomeViewSection = {
  id: "home-view-section-featured-fairs",
  type: "FairsRailHomeViewSection",
  component: {
    title: "Featured Fairs",
    description: "See Works in Top Art Fairs",
  },
  requiresAuthentication: false,
  resolver: withHomeViewTimeout(FeaturedFairsResolver),
}

export const LatestArticles: HomeViewSection = {
  id: "home-view-section-latest-articles",
  type: "ArticlesRailHomeViewSection",
  component: {
    title: "Artsy Editorial",
    behaviors: {
      viewAll: {
        href: "/articles",
      },
    },
  },
  requiresAuthentication: false,
  resolver: withHomeViewTimeout(LatestArticlesResolvers),
}

export const MarketingCollections: HomeViewSection = {
  id: "home-view-section-marketing-collections",
  type: "MarketingCollectionsRailHomeViewSection",
  component: {
    title: "Collections",
  },
  requiresAuthentication: false,
  resolver: withHomeViewTimeout(MarketingCollectionsResolver),
}

export const ShowsForYou: HomeViewSection = {
  id: "home-view-section-shows-for-you",
  type: "ShowsRailHomeViewSection",
  component: {
    title: "Shows for You",
  },
  requiresAuthentication: true,
}

export const ViewingRooms: HomeViewSection = {
  id: "home-view-section-viewing-rooms",
  type: "ViewingRoomsRailHomeViewSection",
  component: {
    title: "Viewing Rooms",
    behaviors: {
      viewAll: {
        href: "/viewing-rooms",
      },
    },
  },
  requiresAuthentication: false,
}

export const LatestActivity: HomeViewSection = {
  id: "home-view-section-latest-activity",
  type: "ActivityRailHomeViewSection",
  component: {
    title: "Latest Activity",
    behaviors: {
      viewAll: {
        href: "/notifications",
        buttonText: "See All",
      },
    },
  },
  requiresAuthentication: true,
  resolver: withHomeViewTimeout(LatestActivityResolver),
}

export const LatestAuctionResults: HomeViewSection = {
  id: "home-view-section-latest-auction-results",
  type: "AuctionResultsRailHomeViewSection",
  component: {
    title: "Latest Auction Results",
    href: "/auction-results-for-artists-you-follow",
    behaviors: {
      viewAll: {
        href: "/auction-results-for-artists-you-follow",
        buttonText: "Browse All Results",
      },
    },
  },
  requiresAuthentication: true,
  resolver: withHomeViewTimeout(LatestAuctionResultsResolver),
}

export const News: HomeViewSection = {
  id: "home-view-section-news",
  type: "ArticlesRailHomeViewSection",
  component: {
    title: "News",
    href: "/news",
    type: "ArticlesCard",
    behaviors: {
      viewAll: {
        href: "/news",
        buttonText: "More in News",
      },
    },
  },
  requiresAuthentication: false,
  resolver: withHomeViewTimeout(NewsResolver),
}

export const Auctions: HomeViewSection = {
  id: "home-view-section-auctions",
  type: "SalesRailHomeViewSection",
  component: {
    title: "Auctions",
    behaviors: {
      viewAll: {
        href: "/auctions",
        buttonText: "Browse All Auctions",
      },
    },
  },
  requiresAuthentication: false,
  resolver: withHomeViewTimeout(SalesResolver),
}

export const ActiveBids: HomeViewSection = {
  id: "home-view-section-active-bids",
  type: "ArtworksRailHomeViewSection",
  component: {
    title: "Your Active Bids",
  },
  requiresAuthentication: true,
  resolver: withHomeViewTimeout(ActiveBidsResolver),
}

/*
 * Galleries Sections
 */

export const GalleriesNearYou: HomeViewSection = {
  id: "home-view-section-galleries-near-you",
  type: "GalleriesHomeViewSection",
  requiresAuthentication: false,
  component: {
    title: "Galleries Near You",
    description:
      "Follow these local galleries for updates on artists you love.",
    backgroundImageURL: "https://files.artsy.net/images/galleries_for_you.webp",
    href: "/galleries-for-you",
    behaviors: {
      viewAll: {
        href: "/galleries-for-you",
        buttonText: "Explore",
      },
    },
  },
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
