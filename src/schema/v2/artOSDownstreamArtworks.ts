import { GraphQLFieldConfig, GraphQLInt } from "graphql"
import GraphQLJSON from "graphql-type-json"
import { ResolverContext } from "types/graphql"

export const ArtOSDownstreamArtworks: GraphQLFieldConfig<
  void,
  ResolverContext
> = {
  type: GraphQLJSON,
  description:
    "Fetch a user's artworks from a third-party source (e.g. Artnet), downstream of Gravity via ArtOS. Only for use by trusted internal clients. Requires the X-Artnet-Token and X-Artnet-User-Id headers.",
  args: {
    page: {
      type: GraphQLInt,
      description: "Page number.",
    },
    pageSize: {
      type: GraphQLInt,
      description: "Number of artworks per page.",
    },
  },
  resolve: (
    _root,
    { page, pageSize },
    { artOSDownstreamArtworksLoader }
  ) => {
    if (!artOSDownstreamArtworksLoader) return null

    return artOSDownstreamArtworksLoader({
      page,
      page_size: pageSize,
    })
  },
}

export default ArtOSDownstreamArtworks
