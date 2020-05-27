import { GraphQLObjectType, GraphQLString } from "graphql"
import { ArtworkContextGridType } from "schema/v1/artwork/artworkContextGrids"
import { artworkConnection } from "schema/v1/artwork"
import { connectionFromArraySlice } from "graphql-relay"
import { pageable } from "relay-cursor-paging"
import { artworkLayers } from "../layers"
import { find } from "lodash"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"

export const RelatedArtworkGridType = new GraphQLObjectType<
  { artwork: any },
  any
>({
  name: "RelatedArtworkGrid",
  interfaces: [ArtworkContextGridType],
  fields: () => ({
    title: {
      type: GraphQLString,
      resolve: () => {
        return `Related works`
      },
    },
    ctaTitle: {
      type: GraphQLString,
      resolve: () => {
        return null
      },
    },
    ctaHref: {
      type: GraphQLString,
      resolve: () => {
        return null
      },
    },
    artworks: {
      type: artworkConnection,
      args: pageable(),
      resolve: async (
        { artwork },
        options,
        { relatedLayerArtworksLoader, relatedLayersLoader }
      ) => {
        const layerID = "main"
        const layers = await artworkLayers(artwork.id, relatedLayersLoader)
        const layer = find(layers, { id: layerID }) as any
        if (!layer) return null

        const { size } = convertConnectionArgsToGravityArgs(options)

        interface GravityArgs {
          artwork: string[]
          size: number
        }

        const gravityArgs: GravityArgs = {
          artwork: [artwork.id],
          size,
        }

        return relatedLayerArtworksLoader(
          { id: layerID, type: layer.type },
          gravityArgs
        ).then((body) => {
          return connectionFromArraySlice(body, options, {
            arrayLength: body && body.length,
            sliceStart: 0,
          })
        })
      },
    },
  }),
})
