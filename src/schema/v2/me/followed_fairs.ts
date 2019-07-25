import Fair from "schema/v2/fair"
import { IDFields } from "schema/v2/object_identification"

import { pageable, getPagingParameters } from "relay-cursor-paging"
import { connectionDefinitions, connectionFromArraySlice } from "graphql-relay"
import { GraphQLObjectType, GraphQLFieldConfig } from "graphql"
import { ResolverContext } from "types/graphql"

const FollowedFairEdge = new GraphQLObjectType<any, ResolverContext>({
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

const FollowedFairs: GraphQLFieldConfig<void, ResolverContext> = {
  type: FollowedFairConnection.connectionType,
  args: pageable({}),
  description: "A list of the current user’s currently followed fair profiles",
  resolve: (_root, options, { followedFairsLoader }) => {
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
        arrayLength: parseInt(headers["x-total-count"] || "0", 10),
        sliceStart: offset,
        // @ts-ignore
        resolveNode: follow_profile => follow_profile.profile.owner,
      })
    })
  },
}

export default FollowedFairs
