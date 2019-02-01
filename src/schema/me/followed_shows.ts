import { ShowType } from "schema/show"
import { IDFields } from "schema/object_identification"

import { pageable, getPagingParameters } from "relay-cursor-paging"
import { connectionDefinitions, connectionFromArraySlice } from "graphql-relay"
import { GraphQLObjectType, GraphQLFieldConfig } from "graphql"
import { ResolverContext } from "types/graphql"

const FollowedShowEdge = new GraphQLObjectType<any, ResolverContext>({
  name: "FollowedShowEdge",
  fields: {
    partner_show: {
      type: ShowType,
    },
    ...IDFields,
  },
})

export const FollowedShowConnection = connectionDefinitions({
  name: "FollowedShow",
  // FIXME: 'edgeType' does not exist in type 'ConnectionConfig'
  // @ts-ignore
  edgeType: FollowedShowEdge,
  nodeType: ShowType,
})

const FollowedShows: GraphQLFieldConfig<void, ResolverContext> = {
  type: FollowedShowConnection.connectionType,
  args: pageable({}),
  description: "A list of the current user’s currently followed shows",
  resolve: (_root, options, { followedShowsLoader }) => {
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
        // @ts-ignore
        resolveNode: follow_show => follow_show.partner_show,
      })
    })
  },
}

export default FollowedShows
