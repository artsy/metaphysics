import { GraphQLInterfaceType, GraphQLString } from "graphql"
import Image from "schema/v2/image"
import { artworkConnection } from "schema/v2/artwork"
import { SlugAndInternalIDFields } from "schema/v2/object_identification"

export const HomePageArtist = new GraphQLInterfaceType({
  name: "HomePageArtist",
  description: "An artist returned in a home page module",
  fields: {
    ...SlugAndInternalIDFields,
    href: {
      type: GraphQLString,
    },
    name: {
      type: GraphQLString,
    },
    formattedNationalityAndBirthday: {
      type: GraphQLString,
    },
    formattedArtworksCount: {
      type: GraphQLString,
    },
    image: Image,
    artworksConnection: {
      type: artworkConnection.connectionType,
    },
  },
})
