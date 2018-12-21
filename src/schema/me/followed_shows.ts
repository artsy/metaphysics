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
      return connectionFromArraySlice(body, options, {
        arrayLength: headers["x-total-count"],
        sliceStart: offset,
      })
    })
  },
}
