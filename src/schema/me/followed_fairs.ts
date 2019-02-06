import Fair from "schema/fair"
import { IDFields } from "schema/object_identification"

import { pageable, getPagingParameters } from "relay-cursor-paging"
import { connectionDefinitions, connectionFromArraySlice } from "graphql-relay"
import { GraphQLObjectType } from "graphql"

const FollowedFairEdge = new GraphQLObjectType<ResolverContext>({
  name: "FollowedProfileEdge",
  fields: {
    ...IDFields,
  },
})

export const FollowedFairConnection = connectionDefinitions({
  name: "FollowedFair",
  // FIXME: 'edgeType' does not exist in type 'ConnectionConfig'
  // @ts-ignore
  edgeType: FollowedFairEdge,
  nodeType: Fair.type,
})

export default {
  type: FollowedFairConnection.connectionType,
  args: pageable({}),
  description: "A list of the current user’s currently followed fair profiles",
  resolve: (
    _root,
    options,
    _request,
    { rootValue: { followedFairsLoader } }
  ) => {
    if (!followedFairsLoader) return null

    const { limit: size, offset } = getPagingParameters(options)
    const gravityArgs = {
      size,
      offset,
      total_count: true,
      ownerType: "FAIR",
    }

    return followedFairsLoader(gravityArgs).then(({ body, headers }) => {
      return connectionFromArraySlice(body, options, {
        arrayLength: headers["x-total-count"],
        sliceStart: offset,
        // @ts-ignore
        resolveNode: follow_profile => follow_profile.profile.owner,
      })
    })
  },
}
