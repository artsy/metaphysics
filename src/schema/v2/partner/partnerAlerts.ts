import { pageable } from "relay-cursor-paging"
import {
  GraphQLString,
  GraphQLObjectType,
  GraphQLList,
  GraphQLBoolean,
} from "graphql"
import {
  connectionWithCursorInfo,
  createPageCursors,
} from "schema/v2/fields/pagination"
import { connectionFromArraySlice } from "graphql-relay"
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
          partner_id: string
          user_ids: string[]
          total_count?: boolean
        }

        const gravityArgs: GravityArgs = {
          page,
          size,
          total_count: true,
          partner_id: parent.partner_id,
          user_ids: parent.user_ids,
        }

        const data = await partnerCollectorProfilesLoader(gravityArgs)

        const collectorProfiles = data.body.flatMap((item) =>
          item.collector_profile ? [item.collector_profile].flat() : []
        )

        return {
          totalCount: collectorProfiles.length,
          pageCursors: createPageCursors(
            { ...args, page, size },
            collectorProfiles.length
          ),
          ...connectionFromArraySlice(collectorProfiles, args, {
            arrayLength: collectorProfiles.length,
            sliceStart: offset,
          }),
        }
      },
    },
  },
})

// export default PartnerAlertType
