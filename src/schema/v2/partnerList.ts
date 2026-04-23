import {
  GraphQLEnumType,
  GraphQLInt,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"
import { pageable } from "relay-cursor-paging"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { ResolverContext } from "types/graphql"
import { InternalIDFields } from "./object_identification"
import { FairType } from "./fair"
import { date } from "./fields/date"
import {
  connectionWithCursorInfo,
  paginationResolver,
} from "./fields/pagination"

export const PartnerListTypeEnum = new GraphQLEnumType({
  name: "PartnerListTypeEnum",
  values: {
    SHOW: { value: "show" },
    FAIR: { value: "fair" },
    OTHER: { value: "other" },
  },
})

export const PartnerListType = new GraphQLObjectType<any, ResolverContext>({
  name: "PartnerList",
  fields: () => {
    // Defer import to avoid circular dependency
    const { ArtworkType } = require("./artwork")

    const PartnerListArtworkConnection = connectionWithCursorInfo({
      name: "PartnerListArtwork",
      nodeType: ArtworkType,
      edgeFields: {
        position: {
          type: new GraphQLNonNull(GraphQLInt),
          resolve: ({ position }) => position,
        },
      },
    })

    return {
      ...InternalIDFields,
      name: {
        type: new GraphQLNonNull(GraphQLString),
      },
      listType: {
        type: new GraphQLNonNull(PartnerListTypeEnum),
        resolve: ({ list_type }) => list_type,
      },
      artworksCount: {
        type: new GraphQLNonNull(GraphQLInt),
        resolve: ({ artworks_count }) => artworks_count,
      },
      startAt: date(({ start_at }) => start_at),
      endAt: date(({ end_at }) => end_at),
      partnerShowID: {
        type: GraphQLString,
        resolve: ({ partner_show_id }) => partner_show_id,
      },
      fair: {
        type: FairType,
        resolve: async ({ fair_id }, _args, { fairLoader }) => {
          if (!fair_id) return null

          return fairLoader(fair_id)
        },
      },
      distributedAt: date(({ distributed_at }) => distributed_at),
      createdAt: date(),
      updatedAt: date(),
      artworksConnection: {
        type: PartnerListArtworkConnection.connectionType,
        args: pageable({}),
        resolve: async ({ id }, args, { partnerListArtworksLoader }) => {
          if (!partnerListArtworksLoader) return null

          const { page, size, offset } = convertConnectionArgsToGravityArgs(
            args
          )

          const { body, headers } = await partnerListArtworksLoader(id, {
            page,
            size,
            total_count: true,
          })

          const totalCount = parseInt(headers["x-total-count"] || "0", 10)

          return paginationResolver({
            totalCount,
            offset,
            page,
            size,
            body,
            args,
            resolveNode: (node) => node.artwork,
          })
        },
      },
    }
  },
})

export const partnerListConnection = connectionWithCursorInfo({
  nodeType: PartnerListType,
})
