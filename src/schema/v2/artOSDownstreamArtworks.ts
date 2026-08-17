import { GraphQLFieldConfig, GraphQLInt, GraphQLString } from "graphql"
import GraphQLJSON from "graphql-type-json"
import { ResolverContext } from "types/graphql"

export const ArtOSDownstreamArtworks: GraphQLFieldConfig<
  void,
  ResolverContext
> = {
  type: GraphQLJSON,
  description:
    "Fetch a user's artworks from a third-party source (e.g. Artnet), downstream of Gravity via ArtOS. Only for use by trusted internal clients.",
  args: {
    userID: {
      type: GraphQLString,
      description: "User ID, if the source scopes artworks by user.",
    },
    token: {
      type: GraphQLString,
      description:
        "Bearer token for the third-party source, if required by it.",
    },
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
    { userID, token, page, pageSize },
    { artOSDownstreamArtworksLoader }
  ) => {
    return artOSDownstreamArtworksLoader({
      user_id: userID,
      token,
      page,
      page_size: pageSize,
    })
  },
}

export default ArtOSDownstreamArtworks
