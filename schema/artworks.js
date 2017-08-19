import gravity from "lib/loaders/legacy/gravity"
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
  resolve: (root, options) => gravity("artworks", options),
}

export default Artworks
