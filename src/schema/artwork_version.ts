import {
  GraphQLID,
  GraphQLObjectType,
  GraphQLString,
  GraphQLNonNull,
} from "graphql"
import { artistNames } from "./artwork/meta"
import Image from "./image"

export const ArtworkVersion = new GraphQLObjectType<ResolverContext>({
  name: "ArtworkVersion",
  fields: () => ({
    id: {
      type: new GraphQLNonNull(GraphQLID),
      description: "ID of the order line item",
    },

    title: {
      type: GraphQLString,
      description: "Artwork title",
    },

    defaultImageID: {
      type: GraphQLString,
      description: "The Image id",
      resolve: ({ default_image_id }) => default_image_id,
    },

    artists: {
      type: GraphQLString,
      description: "The artists related to this Artwork Version",
      resolve: (
        version,
        _options,
        _request,
        { rootValue: { artistsLoader } }
      ) => artistsLoader({ ids: version.artist_ids }),
    },

    artistNames: {
      type: GraphQLString,
      description: "The names for the artists related to this Artwork Version",
      resolve: async (
        version,
        _options,
        _request,
        { rootValue: { artistsLoader } }
      ) => {
        const artists = await artistsLoader({ ids: version.artist_ids })
        return artistNames(artists)
      },
    },

    image: {
      type: Image.type,
      description: "The image representing the Artwork Version",
      resolve: (
        version,
        _options,
        _request,
        { rootValue: { artworkImageLoader } }
      ) =>
        artworkImageLoader({
          artwork_id: version.artwork_id,
          image_id: version.default_image_id,
        }),
    },
  }),
})

export const ArtworkVersionResolver = {
  type: ArtworkVersion,
  description: "A subset of the metadata for an artwork at a specific time",
  args: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The ID of the ArtworkVersion",
    },
  },
  resolve: (
    _root,
    { id },
    _request,
    { rootValue: { authenticatedArtworkVersionLoader } }
  ) => authenticatedArtworkVersionLoader(id),
}
