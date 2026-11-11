import { GraphQLFieldConfig, GraphQLList, GraphQLNonNull } from "graphql"
import { ResolverContext } from "types/graphql"

// `[Artwork!]` field that resolves a model's representative_artwork_ids
// via artworkByIDLoader, coalesces loads made in the
// same tick into one call to avoid fan-out.
// !parent nodes must arrive together, if caller loads each parent separately,
// then you get one call per parent.
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
