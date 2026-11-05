import { merge } from "lodash"
import artist from "./artist"
import artistSeries from "./artistSeries"
import artListingSummary from "./artnet/artListingSummary"
import artnetQuery from "./artnet/query"
import query from "./query"

export const resolvers = merge(
  {
    Node: {
      __resolveType: (obj) => (obj.artist_ids ? "ArtistSeries" : "Artist"),
    },
    Format: {
      HTML: "html",
      MARKDOWN: "markdown",
      PLAIN: "plain",
    },
  },
  query,
  artist,
  artistSeries,
  artnetQuery,
  artListingSummary
)
