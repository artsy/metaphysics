import { artworkConnection } from "./index"
import { IDFields } from "schema/v2/object_identification"
import { GraphQLObjectType, GraphQLString, GraphQLFieldConfig } from "graphql"
import { pageable } from "relay-cursor-paging"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { connectionFromArraySlice } from "graphql-relay"
import { ResolverContext } from "types/graphql"
import cached from "../fields/cached"

const ArtworkLayerType = new GraphQLObjectType<any, ResolverContext>({
  name: "ArtworkLayer",
  fields: () => ({
    ...IDFields,
    cached,
    // NOTE: pagination is not truly supported here.
    // The GraphQL connection spec is observed, but only
    // the number of items to return is respected.
    // hasNextPage is always false.
    artworksConnection: {
      description: "A connection of artworks from a Layer.",
      type: artworkConnection.connectionType,
      args: pageable(),
      resolve: (
        { id, type, artwork_id },
        options,
        { relatedLayerArtworksLoader }
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
          (body) => {
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

const ArtworkLayer: GraphQLFieldConfig<any, ResolverContext> = {
  type: ArtworkLayerType,
}

export default ArtworkLayer
