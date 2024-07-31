import { ResolverContext } from "types/graphql"

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

export type HomeViewSectionKey =
  | "NEW_WORKS_FOR_YOU"
  | "RECENTLY_VIEWED_ARTWORKS"
  | "AUCTION_LOTS_FOR_YOU"
  | "SUGGESTED_ARTISTS"

type HomeViewSection = {
  id: number
  key: HomeViewSectionKey
  title: string
  component: {
    type: string
  }
}

const RECENTLY_VIEWED_ARTWORKS: HomeViewSection = {
  id: 1,
  key: "RECENTLY_VIEWED_ARTWORKS",
  title: "Recently viewed works",
  component: {
    type: "ArtworksRail",
  },
}

const SUGGESTED_ARTISTS: HomeViewSection = {
  id: 2,
  key: "SUGGESTED_ARTISTS",
  title: "Suggested artists for you",
  component: {
    type: "ArtistsRail",
  },
}

const AUCTION_LOTS_FOR_YOU: HomeViewSection = {
  id: 3,
  key: "AUCTION_LOTS_FOR_YOU",
  title: "Auction lots for you",
  component: {
    type: "ArtworksRail",
  },
}

const NEW_WORKS_FOR_YOU: HomeViewSection = {
  id: 4,
  key: "NEW_WORKS_FOR_YOU",
  title: "New works for you",
  component: {
    type: "ArtworksRail",
  },
}
