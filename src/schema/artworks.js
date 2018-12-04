import Artwork from "./artwork"
import { GraphQLList, GraphQLString } from "graphql"

const Artworks = {
  type: new GraphQLList(Artwork.type),
  description: "A list of Artworks",
  args: {
    ids: {
      type: new GraphQLList(GraphQLString),
    },
  },
  resolve: (root, options, request, { rootValue: { artworksLoader } }) =>
    artworksLoader(options),
}

export default Artworks
