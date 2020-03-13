import Artwork from "./artwork"
import {
  GraphQLList,
  GraphQLString,
  GraphQLFieldConfig,
  GraphQLNonNull,
} from "graphql"
import { ResolverContext } from "types/graphql"

export const ArtworksByInternalID: GraphQLFieldConfig<void, ResolverContext> = {
  type: new GraphQLList(Artwork.type),
  description: "A list of artworks by internalID.",
  args: {
    ids: {
      type: new GraphQLNonNull(new GraphQLList(GraphQLString)),
    },
  },
  resolve: (_root, options, { artworksLoader }) => {
    return artworksLoader(options)
  },
}
