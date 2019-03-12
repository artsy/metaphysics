import { ShowType } from "schema/show"
import { IDFields } from "schema/object_identification"

import { pageable, getPagingParameters } from "relay-cursor-paging"
import { connectionDefinitions, connectionFromArraySlice } from "graphql-relay"
import { GraphQLObjectType, GraphQLFieldConfig } from "graphql"
import { ResolverContext } from "types/graphql"
import Near from "../input_fields/near"

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
  args: pageable({
    near: {
      type: Near,
    },
  }),
  description: "A list of the current user’s currently followed shows",
  resolve: (_root, options, { followedShowsLoader }) => {
    if (!followedShowsLoader) return null

    const { limit: size, offset } = getPagingParameters(options)
    const gravityArgs = {
      size,
      offset,
      total_count: true,
      near: !!options.near ? `${options.near.lat},${options.near.lng}` : null,
      max_distance: !!options.near ? options.near.max_distance || 75 : null,
    }

    // this feels weirdly messy to me, but it works. TypeScript complains
    // if I try to add these after initialization, rather than removing.
    if (!gravityArgs.near) {
      delete gravityArgs.near
      delete gravityArgs.max_distance
    }

    return followedShowsLoader(gravityArgs).then(({ body, headers }) => {
      return connectionFromArraySlice(body, options, {
        arrayLength: parseInt(headers["x-total-count"] || "0", 10),
        sliceStart: offset,
        // @ts-ignore
        resolveNode: follow_show => follow_show.partner_show,
      })
    })
  },
}

export default FollowedShows
