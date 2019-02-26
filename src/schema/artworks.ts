import Artwork from "./artwork"
import { GraphQLList, GraphQLString, GraphQLFieldConfig } from "graphql"
import { ResolverContext } from "types/graphql"

const Artworks: GraphQLFieldConfig<void, ResolverContext> = {
  type: new GraphQLList(Artwork.type),
  description: "A list of Artworks",
  args: {
    ids: {
      type: new GraphQLList(GraphQLString),
    },
  },
  resolve: (_root, options, { artworksLoader }) => artworksLoader(options),
}

export default Artworks
