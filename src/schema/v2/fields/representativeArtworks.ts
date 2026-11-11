import { GraphQLFieldConfig, GraphQLList, GraphQLNonNull } from "graphql"
import { ResolverContext } from "types/graphql"

// Reusable `[Artwork!]` field that resolves a model's representative_artwork_ids
// into Artwork objects via artworkByIDLoader, which coalesces across the request
// so it's safe on types returned through a connection (no per-node fan-out).
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
