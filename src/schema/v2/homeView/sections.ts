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
  }
  resolver?: GraphQLFieldResolver<any, ResolverContext>
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
