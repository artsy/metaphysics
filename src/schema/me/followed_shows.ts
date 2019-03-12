import { ShowType } from "schema/show"
import { IDFields } from "schema/object_identification"

import { pageable, getPagingParameters } from "relay-cursor-paging"
import { connectionDefinitions, connectionFromArraySlice } from "graphql-relay"
import { GraphQLObjectType, GraphQLFieldConfig } from "graphql"
import { ResolverContext } from "types/graphql"
import EventStatus from "schema/input_fields/event_status"
import PartnerShowSorts from "schema/sorts/partner_show_sorts"

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
    status: EventStatus,
    sort: PartnerShowSorts,
  }),
  description: "A list of the current user’s currently followed shows",
  resolve: (_root, options, { followedShowsLoader }) => {
    if (!followedShowsLoader) return null

    const { limit: size, offset } = getPagingParameters(options)
    const gravityArgs = {
      size,
      offset,
      total_count: true,
      sort: options.sort,
      status: options.status,
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
