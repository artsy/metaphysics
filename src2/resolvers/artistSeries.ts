import { toGlobalId } from "graphql-relay"
import { formatMarkdownValue } from "lib/helpers"
import { ResolverContext } from "types/graphql"

// See resolver-specs/ArtistSeries.md
export default {
  ArtistSeries: {
    id: ({ _id }) => toGlobalId("ArtistSeries", _id),
    internalID: ({ _id }) => _id,
    slug: ({ id }) => id,
    artistIDs: ({ artist_ids }) => artist_ids,
    artists: async (
      { artist_ids },
      args,
      { artistsLoader }: ResolverContext
    ) => {
      if (artist_ids.length === 0) return []

      const { body } = await artistsLoader({ ids: artist_ids, ...args })
      return body
    },
    artworksCount: ({ artworks_count }) => artworks_count,
    artworksCountMessage: ({ artworks_count, for_sale_artworks_count }) => {
      if (for_sale_artworks_count) {
        return `${for_sale_artworks_count} available`
      }
      return `${artworks_count} ${artworks_count === 1 ? "work" : "works"}`
    },
    descriptionFormatted: ({ description }, { format }) =>
      typeof description === "string"
        ? formatMarkdownValue(description, format)
        : null,
    forSaleArtworksCount: ({ for_sale_artworks_count }) =>
      for_sale_artworks_count,
    representativeArtworkID: ({ representative_artwork_id }) =>
      representative_artwork_id,
  },
}
