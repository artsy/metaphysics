import { pageable } from "relay-cursor-paging"
import {
  GraphQLString,
  GraphQLObjectType,
  GraphQLList,
  GraphQLBoolean,
} from "graphql"
import {
  connectionWithCursorInfo,
  paginationResolver,
} from "schema/v2/fields/pagination"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { CollectorProfileType } from "schema/v2/CollectorProfile/collectorProfile"

const PartnerCollectorProfilesConnectionType = connectionWithCursorInfo({
  name: "PartnerCollectorProfiles",
  nodeType: CollectorProfileType,
}).connectionType

export const PartnerAlertType = new GraphQLObjectType({
  name: "PartnerAlert",
  fields: {
    id: { type: GraphQLString },
    searchCriteriaId: {
      type: GraphQLString,
      resolve: ({ search_criteria_id }) => search_criteria_id,
    },
    partnerId: {
      type: GraphQLString,
      resolve: ({ partner_id }) => partner_id,
    },
    score: { type: GraphQLString },
    matchedAt: {
      type: GraphQLString,
      resolve: ({ matched_at }) => matched_at,
    },
    userIds: {
      type: new GraphQLList(GraphQLString),
      resolve: ({ user_ids }) => user_ids,
    },
    artistId: {
      type: GraphQLString,
      resolve: ({ artist_id }) => artist_id,
    },
    collectorProfilesConnection: {
      type: PartnerCollectorProfilesConnectionType,
      args: pageable({
        totalCount: {
          type: GraphQLBoolean,
        },
      }),
      resolve: async (parent, args, { partnerCollectorProfilesLoader }) => {
        if (!partnerCollectorProfilesLoader) return null

        const { page, size, offset } = convertConnectionArgsToGravityArgs(args)

        type GravityArgs = {
          page: number
          size: number
          offset: number
          total_count: boolean
        }

        const gravityArgs: GravityArgs = {
          page,
          size,
          offset,
          total_count: true,
        }

        const { partner_id, user_ids } = parent
        if (!partner_id || !user_ids) {
          throw new Error(
            "partnerId or userIds is undefined in the parent object"
          )
        }

        const { body, headers } = await partnerCollectorProfilesLoader(
          { partner_id, user_ids },
          gravityArgs
        )

        const collectorProfiles = body.flatMap((item) =>
          item.collector_profile ? [item.collector_profile].flat() : []
        )

        const totalCount = parseInt(headers["x-total-count"] || "0", 10)

        return paginationResolver({
          totalCount,
          offset,
          page,
          size,
          body: collectorProfiles,
          args,
          resolveNode: (node) => node,
        })
      },
    },
  },
})
