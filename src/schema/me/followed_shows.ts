import { ShowType } from "schema/show"
import { IDFields } from "schema/object_identification"

import { pageable, getPagingParameters } from "relay-cursor-paging"
import { connectionDefinitions, connectionFromArraySlice } from "graphql-relay"
import { GraphQLObjectType } from "graphql"

export const FollowedShowType = new GraphQLObjectType({
  name: "FollowedShow",
  fields: {
    partner_show: {
      type: ShowType,
    },
    ...IDFields,
  },
})

export default {
  type: connectionDefinitions({ nodeType: FollowedShowType }).connectionType,
  args: pageable({}),
  description: "A list of the current user’s currently followed shows",
  resolve: (
    _root,
    options,
    _request,
    { rootValue: { followedShowsLoader } }
  ) => {
    if (!followedShowsLoader) return null

    const { limit: size, offset } = getPagingParameters(options)
    const gravityArgs = {
      size,
      offset,
      total_count: true,
    }

    return followedShowsLoader(gravityArgs).then(({ body, headers }) => {
      // `body` holds an array of Shows, but this is expecting an
      // array of FollowedShowConnections where the show lives on a
      // `partner_show` field. This is ugly but I am just going to
      // tweak the shape, here.
      const payload = body.map(item => ({ partner_show: item }))

      return connectionFromArraySlice(payload, options, {
        arrayLength: headers["x-total-count"],
        sliceStart: offset,
      })
    })
  },
}
