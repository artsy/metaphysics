import Artwork from "./index"
import { IDFields } from "schema/object_identification"
import { GraphQLObjectType, GraphQLString, GraphQLList } from "graphql"

const ArtworkLayerType = new GraphQLObjectType({
  name: "ArtworkLayer",
  fields: () => ({
    ...IDFields,
    artworks: {
      type: new GraphQLList(Artwork.type),
      resolve: (
        { id, type, artwork_id },
        options,
        request,
        { rootValue: { relatedLayerArtworksLoader } }
      ) => {
        return relatedLayerArtworksLoader(
          { id, type },
          {
            artwork: [artwork_id],
          }
        )
      },
    },
    description: {
      type: GraphQLString,
    },
    href: {
      type: GraphQLString,
      resolve: ({ more_info_url }) => more_info_url,
    },
    name: {
      type: GraphQLString,
    },
    type: {
      type: GraphQLString,
    },
  }),
})

export default {
  type: ArtworkLayerType,
}
