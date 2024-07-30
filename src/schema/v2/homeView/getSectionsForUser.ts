import { ResolverContext } from "types/graphql"
import {
  AuctionLotsForYouResolver,
  NewWorksForYouResolver,
  RecentlyViewedArtworksResolver,
} from "./artworkResolvers"
import { GraphQLFieldResolver } from "graphql"

export async function getSectionsForUser(
  context: ResolverContext
): Promise<HomeViewSection[]> {
  /*
   * FAKE temporary placeholder logic for determining the sections that a user will see
   */
  const { meLoader } = context.authenticatedLoaders

  if (!meLoader) throw new Error("You must be signed in to see this content.")

  const me = await meLoader()

  let sections: HomeViewSection[] = []

  if (me.type === "Admin") {
    sections = [
      RECENTLY_VIEWED_ARTWORKS,
      SUGGESTED_ARTISTS,
      AUCTION_LOTS_FOR_YOU,
      NEW_WORKS_FOR_YOU,
    ]
  } else {
    sections = [
      NEW_WORKS_FOR_YOU,
      AUCTION_LOTS_FOR_YOU,
      SUGGESTED_ARTISTS,
      RECENTLY_VIEWED_ARTWORKS,
    ]
  }

  return sections
}

// stub sections

type HomeViewSection = {
  id: string
  type: string
  component: {
    title: string
  }
  resolver?: GraphQLFieldResolver<any, ResolverContext>
}

const RECENTLY_VIEWED_ARTWORKS: HomeViewSection = {
  id: "home-view-section-recently-viewed-artworks",
  type: "ArtworksRailHomeViewSection",
  component: {
    title: "Recently viewed works",
  },
  resolver: RecentlyViewedArtworksResolver,
}

const SUGGESTED_ARTISTS: HomeViewSection = {
  id: "home-view-section-suggested-artists",
  type: "ArtistsRailHomeViewSection",
  component: {
    title: "Suggested artists for you",
  },
}

const AUCTION_LOTS_FOR_YOU: HomeViewSection = {
  id: "home-view-section-auction-lots-for-you",
  type: "ArtworksRailHomeViewSection",
  component: {
    title: "Auction lots for you",
  },
  resolver: AuctionLotsForYouResolver,
}

const NEW_WORKS_FOR_YOU: HomeViewSection = {
  id: "home-view-section-new-works-for-you",
  type: "ArtworksRailHomeViewSection",
  component: {
    title: "New works for you",
  },
  resolver: NewWorksForYouResolver,
}
