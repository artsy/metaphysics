import Artwork from "./index"
import gravity from "lib/loaders/gravity"
import { IDFields } from "schema/object_identification"
import { GraphQLObjectType, GraphQLString, GraphQLList } from "graphql"

const ArtworkLayerType = new GraphQLObjectType({
  name: "ArtworkLayer",
  fields: () => ({
    ...IDFields,
    artworks: {
      type: new GraphQLList(Artwork.type),
      resolve: ({ id, type, artwork_id }) => {
        return gravity(`related/layer/${type}/${id}/artworks`, {
          artwork: [artwork_id],
        })
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
