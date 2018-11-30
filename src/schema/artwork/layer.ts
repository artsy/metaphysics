import Artwork, { artworkConnection } from "./index"
import { IDFields } from "schema/object_identification"
import { GraphQLObjectType, GraphQLString, GraphQLList } from "graphql"
import { pageable } from "relay-cursor-paging"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { flatten } from "lodash"
import { connectionFromArraySlice } from "graphql-relay"

const ArtworkLayerType = new GraphQLObjectType({
  name: "ArtworkLayer",
  fields: () => ({
    ...IDFields,
    artworks: {
      type: new GraphQLList(Artwork.type),
      resolve: (
        { id, type, artwork_id },
        _options,
        _request,
        { rootValue: { relatedLayerArtworksLoader } }
      ) => {
        return relatedLayerArtworksLoader(
          { id, type },
          {
            artwork: [artwork_id],
          }
        ).then(({ body }) => body)
      },
    },
    artworksConnection: {
      description: "A connection of artworks from a Layer.",
      type: artworkConnection,
      args: pageable(),
      resolve: (
        { id, type, artwork_id },
        options,
        _request,
        { rootValue: { relatedLayerArtworksLoader } }
      ) => {
        const { page, size, offset } = convertConnectionArgsToGravityArgs(
          options
        )

        interface GravityArgs {
          artwork: string[]
          exclude_ids?: string[]
          page: number
          size: number
          total_count: boolean
        }

        const gravityArgs: GravityArgs = {
          artwork: [artwork_id],
          total_count: true,
          page,
          size,
        }

        if (options.exclude) {
          gravityArgs.exclude_ids = flatten([options.exclude])
        }

        return relatedLayerArtworksLoader({ id, type }, gravityArgs).then(
          ({ body, headers }) => {
            return connectionFromArraySlice(body, options, {
              arrayLength: headers["x-total-count"],
              sliceStart: offset,
            })
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
