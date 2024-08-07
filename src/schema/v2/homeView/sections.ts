import { GraphQLFieldResolver } from "graphql"
import { ResolverContext } from "types/graphql"
import {
  AuctionLotsForYouResolver,
  NewWorksForYouResolver,
  NewWorksFromGalleriesYouFollowResolver,
  RecentlyViewedArtworksResolver,
  SimilarToRecentlyViewedArtworksResolver,
  SuggestedArtistsResolver,
} from "./artworkResolvers"

export type HomeViewSection = {
  id: string
  type: string
  component: {
    title: string
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

export const TrendingArtists: HomeViewSection = {
  id: "home-view-section-trending-artists",
  type: "ArtistsRailHomeViewSection",
  component: {
    title: "Trending Artists on Artsy",
  },
  resolver: SuggestedArtistsResolver,
}

const sections: HomeViewSection[] = [
  AuctionLotsForYou,
  NewWorksForYou,
  NewWorksFromGalleriesYouFollow,
  RecentlyViewedArtworks,
  TrendingArtists,
  SimilarToRecentlyViewedArtworks,
]

export const registry = sections.reduce(
  (acc, section) => ({ ...acc, [section.id]: section }),
  {}
)
