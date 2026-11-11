import { GraphQLFieldConfig, GraphQLList, GraphQLNonNull } from "graphql"
import { ResolverContext } from "types/graphql"

// Reusable `[Artwork!]` field that resolves a model's representative_artwork_ids
// into Artwork objects via artworkByIDLoader, which coalesces loads made in the
// same tick into one /artworks call.
//
// This avoids per-node fan-out only when the parent nodes arrive together (e.g.
// a connection that returns its page in one upstream call). If a caller loads
// each parent in its own request/tick (say artistLoader(id) per item), those
// loads land in separate ticks and you get one /artworks call per parent again
// — the coalescing is not an unconditional guarantee.
//
// Call this inside a type's `fields: () => ({...})` thunk — the lazy require of
// ArtworkType below needs the module graph built to avoid a circular import.
export const representativeArtworks = (): GraphQLFieldConfig<
  any,
  ResolverContext
> => {
  const { ArtworkType } = require("schema/v2/artwork")

  return {
    type: new GraphQLList(new GraphQLNonNull(ArtworkType)),
    description: "Representative artworks (ordered), resolved from their ids.",
    resolve: async (parent, _args, { artworkByIDLoader }) => {
      const ids: string[] = parent.representative_artwork_ids ?? []
      if (!ids.length) return []

      const artworks = await Promise.all(
        ids.map((id) => artworkByIDLoader.load(id))
      )
      return artworks.filter(Boolean)
    },
  }
}
