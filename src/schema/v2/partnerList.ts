import {
  GraphQLBoolean,
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
import { PartnerListPublicationType } from "./partnerListPublication"

export const PartnerListTypeEnum = new GraphQLEnumType({
  name: "PartnerListTypeEnum",
  values: {
    SHOW: { value: "show" },
    FAIR: { value: "fair" },
    PRIVATE_VIEWING_ROOM: { value: "private_viewing_room" },
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
      // published/passcodeProtected read from the `partner_list_publication`
      // key Gravity inlines on every PartnerList response (index, show,
      // mutation payloads) — unlike `publication` below, this never issues a
      // separate `partner_list/:id/publication` call, so it's safe to resolve
      // per node inside partnerListsConnection with no N+1.
      published: {
        type: GraphQLBoolean,
        description:
          "Whether this list's private viewing room publication is live. Null if no publication exists yet.",
        resolve: ({ partner_list_publication }) =>
          partner_list_publication?.published ?? null,
      },
      passcodeProtected: {
        type: GraphQLBoolean,
        description:
          "Whether this list's private viewing room publication is gated by a passcode. Null if no publication exists yet.",
        resolve: ({ partner_list_publication }) =>
          partner_list_publication?.passcode_protected ?? null,
      },
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
      publication: {
        type: PartnerListPublicationType,
        description:
          "The private viewing room publication for this list, if one exists (only applies to private_viewing_room lists). Not resolvable through partnerListsConnection.",
        resolve: async (
          { id, _fromConnection },
          _args,
          { partnerListPublicationLoader }
        ) => {
          if (!partnerListPublicationLoader) return null

          // A PartnerList has at most one publication (Gravity enforces
          // uniqueness on partner_list_id), and there's no Gravity endpoint to
          // fetch publications for many lists at once — resolving this per
          // node in partnerListsConnection would be an N+1 (one Gravity call
          // per row on every page). There's no product need to list
          // publications in bulk, so instead of batching, this field simply
          // refuses to resolve when reached that way — see
          // Partner.partnerListsConnection's resolver, the only place
          // `_fromConnection` gets set. Every other access path (the single
          // `partnerList(id:)` lookup, and every PartnerList mutation
          // payload) is unflagged and resolves normally — inverted this way
          // on purpose so new single-list return sites don't have to
          // remember to opt in.
          if (_fromConnection) return null

          try {
            return await partnerListPublicationLoader(id)
          } catch (error) {
            if (error?.statusCode === 404) return null
            throw error
          }
        },
      },
    }
  },
})

export const partnerListConnection = connectionWithCursorInfo({
  nodeType: PartnerListType,
})
