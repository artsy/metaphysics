import { GraphQLFieldResolver } from "graphql"
import { ResolverContext } from "types/graphql"
import {
  AuctionLotsForYouResolver,
  CuratorsPicksEmergingArtworksResolver,
  NewWorksForYouResolver,
  NewWorksFromGalleriesYouFollowResolver,
  RecentlyViewedArtworksResolver,
  SimilarToRecentlyViewedArtworksResolver,
} from "./artworkResolvers"
import {
  RecommendedArtistsResolver,
  SuggestedArtistsResolver,
} from "./artistResolvers"
import { HeroUnitsResolver } from "./heroUnitsResolver"
import { FeaturedFairsResolver } from "./featuredFairsResolver"

type MaybeResolved<T> =
  | T
  | ((context: ResolverContext, args: any) => Promise<T>)
import { LatestArticlesResolvers } from "./articlesResolvers"
import { MarketingCollectionsResolver } from "./marketingCollectionsResolver"
import { LatestActivityResolver } from "./activityResolvers"
import { LatestAuctionResultsResolver } from "./auctionResultsResolvers"

export type HomeViewSection = {
  id: string
  type: string
  component?: {
    title?: MaybeResolved<string>
    type?: string
    description?: MaybeResolved<string>
    backgroundImageURL?: MaybeResolved<string>
    href?: MaybeResolved<string>
  }
  resolver?: GraphQLFieldResolver<any, ResolverContext>
}

export const SimilarToRecentlyViewedArtworks: HomeViewSection = {
  id: "home-view-section-similar-to-recently-viewed-artworks",
  type: "ArtworksRailHomeViewSection",
  component: {
    title: "Similar to Works You’ve Viewed",
  },
  resolver: SimilarToRecentlyViewedArtworksResolver,
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
    href: "/collection/curators-picks-emerging",
  },
  resolver: CuratorsPicksEmergingArtworksResolver,
}

export const RecentlyViewedArtworks: HomeViewSection = {
  id: "home-view-section-recently-viewed-artworks",
  type: "ArtworksRailHomeViewSection",
  component: {
    title: "Recently viewed works",
  },
  resolver: RecentlyViewedArtworksResolver,
}

export const AuctionLotsForYou: HomeViewSection = {
  id: "home-view-section-auction-lots-for-you",
  type: "ArtworksRailHomeViewSection",
  component: {
    title: "Auction lots for you",
  },
  resolver: AuctionLotsForYouResolver,
}

export const NewWorksForYou: HomeViewSection = {
  id: "home-view-section-new-works-for-you",
  type: "ArtworksRailHomeViewSection",
  component: {
    title: "New works for you",
  },
  resolver: NewWorksForYouResolver,
}

export const NewWorksFromGalleriesYouFollow: HomeViewSection = {
  id: "home-view-section-new-works-from-galleries-you-follow",
  type: "ArtworksRailHomeViewSection",
  component: {
    title: "New Works from Galleries You Follow",
  },
  resolver: NewWorksFromGalleriesYouFollowResolver,
}

// Artists Rails

export const TrendingArtists: HomeViewSection = {
  id: "home-view-section-trending-artists",
  type: "ArtistsRailHomeViewSection",
  component: {
    title: "Trending Artists on Artsy",
  },
  resolver: SuggestedArtistsResolver,
}

export const RecommendedArtists: HomeViewSection = {
  id: "home-view-section-recommended-artists",
  type: "ArtistsRailHomeViewSection",
  component: {
    title: "Recommended Artists",
  },
  resolver: RecommendedArtistsResolver,
}

export const HeroUnits: HomeViewSection = {
  id: "home-view-section-hero-units",
  type: "HeroUnitsHomeViewSection",
  resolver: HeroUnitsResolver,
}

export const FeaturedFairs: HomeViewSection = {
  id: "home-view-section-featured-fairs",
  type: "FairsRailHomeViewSection",
  component: {
    title: "Featured Fairs",
    description: "See Works in Top Art Fairs",
  },
  resolver: FeaturedFairsResolver,
}

export const LatestArticles: HomeViewSection = {
  id: "home-view-section-latest-articles",
  type: "ArticlesRailHomeViewSection",
  component: {
    title: "Artsy Editorial",
  },
  resolver: LatestArticlesResolvers,
}

export const MarketingCollections: HomeViewSection = {
  id: "home-view-section-marketing-collections",
  type: "MarketingCollectionsRailHomeViewSection",
  component: {
    title: "Collections",
  },
  resolver: MarketingCollectionsResolver,
}

export const ShowsForYou: HomeViewSection = {
  id: "home-view-section-shows-for-you",
  type: "ShowsRailHomeViewSection",
  component: {
    title: "Shows for You",
  },
}

export const ViewingRooms: HomeViewSection = {
  id: "home-view-section-viewing-rooms",
  type: "ViewingRoomsRailHomeViewSection",
  component: {
    title: "Viewing Rooms",
  },
}

export const LatestActivity: HomeViewSection = {
  id: "home-view-section-latest-activity",
  type: "ActivityRailHomeViewSection",
  component: {
    title: "Latest Activity",
  },
  resolver: LatestActivityResolver,
}

export const LatestAuctionResults: HomeViewSection = {
  id: "home-view-section-latest-auction-results",
  type: "AuctionResultsRailHomeViewSection",
  component: {
    title: "Latest Auction Results",
    href: "/auction-results-for-artists-you-follow",
  },
  resolver: LatestAuctionResultsResolver,
}

const sections: HomeViewSection[] = [
  AuctionLotsForYou,
  CuratorsPicksEmerging,
  FeaturedFairs,
  HeroUnits,
  LatestActivity,
  LatestArticles,
  LatestAuctionResults,
  MarketingCollections,
  MarketingCollections,
  NewWorksForYou,
  NewWorksFromGalleriesYouFollow,
  RecentlyViewedArtworks,
  RecommendedArtists,
  ShowsForYou,
  SimilarToRecentlyViewedArtworks,
  TrendingArtists,
  ViewingRooms,
]

export const registry = sections.reduce(
  (acc, section) => ({ ...acc, [section.id]: section }),
  {}
)
