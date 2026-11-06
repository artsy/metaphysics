import { merge } from "lodash"
import artist from "./artist"
import artistSeries from "./artistSeries"
import artListingSummary from "./artnet/artListingSummary"
import artworkSummary from "./artnet/artworkSummary"
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
  artistSeries
)

// Resolvers for the Artnet schema (artnet-schema.graphql). They're written
// against the unprefixed type names; schema.ts adds the `artnet_` prefix.
export const artnetResolvers = merge(
  {},
  artnetQuery,
  artListingSummary,
  artworkSummary
)
