import { GraphQLFieldResolver } from "graphql"
import { ResolverContext } from "types/graphql"

export const STUB_SECTIONS = [
  {
    id: 1,
    key: "RECENTLY_VIEWED_ARTWORKS",
    title: "Recently viewed works",
    component: {
      type: "artworks_rail",
    },
  },
  {
    id: 2,
    key: "SUGGESTED_ARTISTS",
    title: "Suggested artists for you",
    component: {
      type: "artists_rail",
    },
  },
  {
    id: 3,
    key: "AUCTION_LOTS_FOR_YOU",
    title: "Auction lots for you",
    component: {
      type: "artworks_rail",
    },
  },
]

export const stubDataResolver: GraphQLFieldResolver<
  void,
  ResolverContext
> = () => {
  return STUB_SECTIONS
}
