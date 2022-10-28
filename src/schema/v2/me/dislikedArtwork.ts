import { GraphQLBoolean, GraphQLNonNull, GraphQLString } from "graphql"
import { ArtworkType } from "../artwork"
import { connectionWithCursorInfo } from "../fields/pagination"

const COLLECTION_ID = "disliked-artwork"

export const DislikedArtworksConnection = connectionWithCursorInfo({
  name: "DislikedArtworks",
  nodeType: ArtworkType,
  connectionFields: {
    description: {
      type: new GraphQLNonNull(GraphQLString),
    },
    default: {
      type: new GraphQLNonNull(GraphQLBoolean),
    },
    name: {
      type: new GraphQLNonNull(GraphQLString),
    },
    private: {
      type: new GraphQLNonNull(GraphQLBoolean),
    },
  },
})
