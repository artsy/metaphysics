import { GraphQLFieldResolver } from "graphql"
import { ResolverContext } from "types/graphql"

const STUB_SECTIONS = [
  {
    key: "RECENTLY_VIEWED_ARTWORKS",
    title: "Recently viewed works",
    component: {
      type: "artworks_rail",
    },
  },
  {
    key: "SUGGESTED_ARTISTS",
    title: "Suggested artists for you",
    component: {
      type: "artists_rail",
    },
  },
]
export const stubDataResolver: GraphQLFieldResolver<
  void,
  ResolverContext
> = () => {
  return STUB_SECTIONS
}
