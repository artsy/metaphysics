import Artist from "schema/artist"
import { IDFields } from "schema/object_identification"

import { pageable, getPagingParameters } from "relay-cursor-paging"
import { connectionDefinitions, connectionFromArraySlice } from "graphql-relay"
import { GraphQLObjectType, GraphQLBoolean, GraphQLFieldConfig } from "graphql"
import { ResolverContext } from "types/graphql"

export const FollowArtistType = new GraphQLObjectType<any, ResolverContext>({
  name: "FollowArtist",
  fields: {
    artist: {
      type: Artist.type,
    },
    auto: {
      type: GraphQLBoolean,
    },
    ...IDFields,
  },
})

const FollowedArtists: GraphQLFieldConfig<void, ResolverContext> = {
  type: connectionDefinitions({ nodeType: FollowArtistType }).connectionType,
  args: pageable({}),
  description: "A list of the current user’s inquiry requests",
  resolve: (_root, options, { followedArtistsLoader }) => {
    if (!followedArtistsLoader) return null
    const { limit: size, offset } = getPagingParameters(options)
    const gravityArgs = {
      size,
      offset,
      total_count: true,
    }
    return followedArtistsLoader(gravityArgs).then(({ body, headers }) => {
      return connectionFromArraySlice(body, options, {
        arrayLength: parseInt(headers["x-total-count"] || "0", 10),
        sliceStart: offset,
      })
    })
  },
}

export default FollowedArtists
