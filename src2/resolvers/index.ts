import artist from "./artist"
import artistSeries from "./artistSeries"
import query from "./query"

export const resolvers = {
  Node: {
    __resolveType: (obj) => (obj.artist_ids ? "ArtistSeries" : "Artist"),
  },
  Format: {
    HTML: "html",
    MARKDOWN: "markdown",
    PLAIN: "plain",
  },
  ...query,
  ...artist,
  ...artistSeries,
}
