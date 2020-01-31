import { GraphQLObjectType, GraphQLString } from "graphql"
import {
  ArtworkContextGridType,
  formDefaultGravityArgs,
} from "schema/v2/artwork/artworkContextGrids"
import { artworkConnection } from "schema/v2/artwork"
import { connectionFromArraySlice } from "graphql-relay"
import { artistArtworkArrayLength } from "schema/v2/artist"
import { pageable } from "relay-cursor-paging"

export const ArtistArtworkGridType = new GraphQLObjectType<
  { artist: any; artwork: any },
  any
>({
  name: "ArtistArtworkGrid",
  interfaces: [ArtworkContextGridType],
  fields: () => ({
    title: {
      type: GraphQLString,
      resolve: ({ artist }) => {
        if (!artist) return null
        return `Other works by ${artist.name}`
      },
    },
    ctaTitle: {
      type: GraphQLString,
      resolve: ({ artist }) => {
        if (!artist) return null
        return `View all works by ${artist.name}`
      },
    },
    ctaHref: {
      type: GraphQLString,
      resolve: ({ artist }) => {
        if (!artist) return null
        return `/artist/${artist.id}`
      },
    },
    artworksConnection: {
      type: artworkConnection.connectionType,
      args: pageable(),
      resolve: ({ artist, artwork }, options, { artistArtworksLoader }) => {
        if (!artist) return null
        const { gravityArgs, offset } = formDefaultGravityArgs({
          options,
          artwork,
        })
        gravityArgs.sort = "-merchandisability"

        return artistArtworksLoader(artist.id, gravityArgs).then(artworks => {
          if (!artworks) return null

          return connectionFromArraySlice(artworks, options, {
            arrayLength: artistArtworkArrayLength(artist, options.filter),
            sliceStart: offset,
          })
        })
      },
    },
  }),
})
