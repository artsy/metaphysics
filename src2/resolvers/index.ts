import artist from "./artist"
import query from "./query"

export const resolvers = {
  Node: {
    // Artist is the only type implementing Node so far.
    __resolveType: () => "Artist",
  },
  ...query,
  ...artist,
}
