import { GraphQLFieldResolver } from "graphql"
import {
  AuctionLotsForYouResolver,
  NewWorksForYouResolver,
  RecentlyViewedArtworksResolver,
} from "./artworkResolvers"
import { ResolverContext } from "types/graphql"

export type HomeViewSection = {
  id: string
  type: string
  component: {
    title: string
    // The full list of available routes in Eigen is here:
    // https://github.com/artsy/eigen/blob/main/src/app/routes.ts#L122
    // If you add a route that Eigen doesn't know, users will be navigated to
    // a webview page
    href?: string
  }
  resolver?: GraphQLFieldResolver<any, ResolverContext>
}

export const RecentlyViewedArtworks: HomeViewSection = {
  id: "home-view-section-recently-viewed-artworks",
  type: "ArtworksRailHomeViewSection",
  component: {
    title: "Recently viewed works",
    href: "/recently-viewed",
  },
  resolver: RecentlyViewedArtworksResolver,
}

export const AuctionLotsForYou: HomeViewSection = {
  id: "home-view-section-auction-lots-for-you",
  type: "ArtworksRailHomeViewSection",
  component: {
    title: "Auction lots for you",
    href: "/auctions/lots-for-you-ending-soon",
  },
  resolver: AuctionLotsForYouResolver,
}

export const NewWorksForYou: HomeViewSection = {
  id: "home-view-section-new-works-for-you",
  type: "ArtworksRailHomeViewSection",
  component: {
    title: "New works for you",
    href: "/new-for-you",
  },
  resolver: NewWorksForYouResolver,
}

export const SuggestedArtists: HomeViewSection = {
  id: "home-view-section-suggested-artists",
  type: "ArtistsRailHomeViewSection",
  component: {
    title: "Suggested artists for you",
  },
}

const sections: HomeViewSection[] = [
  RecentlyViewedArtworks,
  AuctionLotsForYou,
  NewWorksForYou,
  SuggestedArtists,
]

export const registry = sections.reduce(
  (acc, section) => ({ ...acc, [section.id]: section }),
  {}
)
