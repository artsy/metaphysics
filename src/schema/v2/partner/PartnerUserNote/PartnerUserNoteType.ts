import {
  GraphQLFieldConfig,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"
import { pageable } from "relay-cursor-paging"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { date } from "schema/v2/fields/date"
import {
  connectionWithCursorInfo,
  paginationResolver,
} from "schema/v2/fields/pagination"
import { InternalIDFields } from "schema/v2/object_identification"
import { ResolverContext } from "types/graphql"

export const PartnerUserNoteType = new GraphQLObjectType<any, ResolverContext>({
  name: "PartnerUserNote",
  description: "A partner's private note about a collector.",
  fields: () => ({
    ...InternalIDFields,
    partnerId: {
      type: new GraphQLNonNull(GraphQLString),
      resolve: ({ partner_id }) => partner_id,
    },
    userId: {
      type: new GraphQLNonNull(GraphQLString),
      description: "ID of the collector this note is about.",
      resolve: ({ user_id }) => user_id,
    },
    body: {
      type: new GraphQLNonNull(GraphQLString),
      resolve: ({ body }) => body,
    },
    updatedByUserId: {
      type: new GraphQLNonNull(GraphQLString),
      description: "ID of the partner user who last touched this note.",
      resolve: ({ updated_by_user_id }) => updated_by_user_id,
    },
    updatedByUserName: {
      type: GraphQLString,
      description:
        "Name of the partner user who last touched this note. Null if that user has since been deleted or has no name.",
      resolve: ({ updated_by_user_name }) => updated_by_user_name,
    },
    createdAt: date(),
    updatedAt: date(),
  }),
})

export const partnerUserNotesConnection = connectionWithCursorInfo({
  nodeType: PartnerUserNoteType,
})

export const UserNotesConnection: GraphQLFieldConfig<any, ResolverContext> = {
  description: "A connection of notes this partner has made about collectors.",
  type: partnerUserNotesConnection.connectionType,
  args: pageable({
    userId: {
      type: GraphQLString,
      description: "Only return notes about this collector.",
    },
  }),
  resolve: async ({ _id }, args, { partnerUserNotesLoader }) => {
    if (!partnerUserNotesLoader) return null

    const { page, size, offset } = convertConnectionArgsToGravityArgs(args)

    const { body, headers } = await partnerUserNotesLoader({
      partner_id: _id,
      user_id: args.userId,
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
    })
  },
}

export const CollectorResumeNotesConnection: GraphQLFieldConfig<
  any,
  ResolverContext
> = {
  description: "Notes this partner has made about this collector.",
  type: partnerUserNotesConnection.connectionType,
  args: pageable({}),
  resolve: async ({ partnerId, userId }, args, { partnerUserNotesLoader }) => {
    if (!partnerUserNotesLoader) return null
    if (!partnerId || !userId) return null

    const { page, size, offset } = convertConnectionArgsToGravityArgs(args)

    const { body, headers } = await partnerUserNotesLoader({
      partner_id: partnerId,
      user_id: userId,
      page,
      size,
      total_count: true,
    })

    const totalCount = parseInt(headers["x-total-count"] || "0", 10)

    return paginationResolver({ totalCount, offset, page, size, body, args })
  },
}

export const PartnerUserNote: GraphQLFieldConfig<void, ResolverContext> = {
  type: PartnerUserNoteType,
  description: "A partner's note about a collector.",
  args: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The ID of the PartnerUserNote.",
    },
  },
  resolve: (_root, { id }, { partnerUserNoteLoader }) => {
    if (!partnerUserNoteLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    return partnerUserNoteLoader(id)
  },
}
