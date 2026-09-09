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

export const PartnerUserNoteType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "PartnerUserNote",
  description: "A partner's private note about a collector.",
  fields: () => ({
    ...InternalIDFields,
    partnerId: {
      type: GraphQLString,
      resolve: ({ partner_id }) => partner_id,
    },
    userId: {
      type: GraphQLString,
      description: "ID of the collector this note is about.",
      resolve: ({ user_id }) => user_id,
    },
    body: {
      type: GraphQLString,
      resolve: ({ body }) => body,
    },
    updatedByUserId: {
      type: GraphQLString,
      description: "ID of the partner user who last touched this note.",
      resolve: ({ updated_by_user_id }) => updated_by_user_id,
    },
    createdAt: date(),
    updatedAt: date(),
  }),
})

export const partnerUserNotesConnection = connectionWithCursorInfo({
  nodeType: PartnerUserNoteType,
})

export const UserNotesConnection: GraphQLFieldConfig<any, ResolverContext> = {
  description:
    "A connection of notes this partner has made about collectors.",
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
