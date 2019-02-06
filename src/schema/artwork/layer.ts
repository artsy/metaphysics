import Artwork, { artworkConnection } from "./index"
import { IDFields } from "schema/object_identification"
import { GraphQLObjectType, GraphQLString, GraphQLList } from "graphql"
import { pageable } from "relay-cursor-paging"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { connectionFromArraySlice } from "graphql-relay"

const ArtworkLayerType = new GraphQLObjectType<ResolverContext>({
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
        )
      },
    },
    // NOTE: pagination is not truly supported here.
    // The GraphQL connection spec is observed, but only
    // the number of items to return is respected.
    // hasNextPage is always false.
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
        const { size } = convertConnectionArgsToGravityArgs(options)

        interface GravityArgs {
          artwork: string[]
          size: number
        }

        const gravityArgs: GravityArgs = {
          artwork: [artwork_id],
          size,
        }

        return relatedLayerArtworksLoader({ id, type }, gravityArgs).then(
          body => {
            return connectionFromArraySlice(body, options, {
              arrayLength: body && body.length,
              sliceStart: 0,
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
