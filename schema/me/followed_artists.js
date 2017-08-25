import _ from "lodash"

import gravity from "lib/loaders/legacy/gravity"
import Artist from "schema/artist"
import { IDFields } from "schema/object_identification"

import { pageable, getPagingParameters } from "relay-cursor-paging"
import { connectionDefinitions, connectionFromArraySlice } from "graphql-relay"
import { GraphQLObjectType, GraphQLBoolean } from "graphql"

export const FollowArtistType = new GraphQLObjectType({
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
  isTypeOf: obj => _.has(obj, "artist") && _.has(obj, "auto"),
})

export default {
  type: connectionDefinitions({ nodeType: FollowArtistType }).connectionType,
  args: pageable({}),
  description: "A list of the current user’s inquiry requests",
  resolve: (root, options, request, { rootValue: { accessToken } }) => {
    if (!accessToken) return null
    const { limit: size, offset } = getPagingParameters(options)
    const gravityArgs = {
      size,
      offset,
      total_count: true,
    }
    return gravity.with(accessToken, { headers: true })("me/follow/artists", gravityArgs).then(({ body, headers }) => {
      return connectionFromArraySlice(body, options, {
        arrayLength: headers["x-total-count"],
        sliceStart: offset,
      })
    })
  },
}
