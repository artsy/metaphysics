import {
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLFieldConfig,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"
import { connectionFromArray, connectionFromArraySlice } from "graphql-relay"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { pick } from "lodash"
import { pageable } from "relay-cursor-paging"
import { date } from "schema/v2/fields/date"
import {
  connectionWithCursorInfo,
  createPageCursors,
} from "schema/v2/fields/pagination"
import { ResolverContext } from "types/graphql"
import { artworkConnection } from "../artwork"
import numeral from "../fields/numeral"
import { IDFields, NodeInterface } from "../object_identification"

const NotificationTypesEnum = new GraphQLEnumType({
  name: "NotificationTypesEnum",
  values: {
    ARTWORK_ALERT: { value: "SavedSearchHitActivity" },
    ARTWORK_PUBLISHED: { value: "ArtworkPublishedActivity" },
  },
})

export const NotificationType = new GraphQLObjectType<any, ResolverContext>({
  name: "Notification",
  interfaces: [NodeInterface],
  fields: () => ({
    ...IDFields,
    title: {
      type: new GraphQLNonNull(GraphQLString),
      resolve: ({ actors }) => actors,
    },
    message: {
      type: new GraphQLNonNull(GraphQLString),
      resolve: ({ message }) => message.toLowerCase(),
    },
    isUnread: {
      type: new GraphQLNonNull(GraphQLBoolean),
      resolve: ({ status }) => status === "unread",
    },
    createdAt: date(({ date }) => date),
    targetHref: {
      type: new GraphQLNonNull(GraphQLString),
      resolve: ({ object }) => `/artist/${object.artist.id}/works-for-sale`,
    },
    notificationType: {
      type: new GraphQLNonNull(NotificationTypesEnum),
      resolve: ({ actors }) =>
        actors.startsWith("Works by")
          ? "SavedSearchHitActivity"
          : "ArtworkPublishedActivity",
    },
    artworksConnection: {
      type: artworkConnection.connectionType,
      args: pageable(),
      resolve: async ({ object_ids: ids }, args, { artworksLoader }) => {
        const { page, size } = convertConnectionArgsToGravityArgs(args)
        return artworksLoader({ ids, batched: true }).then((body) => {
          const totalCount = body.length
          return {
            totalCount,
            pageCursors: createPageCursors({ page, size }, totalCount),
            ...connectionFromArray(body, args),
          }
        })
      },
    },
  }),
})

const NotificationCounts = {
  type: new GraphQLObjectType<any, ResolverContext>({
    name: "NotificationCounts",
    fields: {
      total: numeral(({ total }) => total),
      unread: numeral(({ unread }) => unread),
    },
  }),
  resolve: (data) => data.counts,
}

export const NotificationsConnection: GraphQLFieldConfig<
  void,
  ResolverContext
> = {
  type: connectionWithCursorInfo({
    nodeType: NotificationType,
    connectionFields: { counts: NotificationCounts },
  }).connectionType,
  description: "A feed of notifications",
  args: pageable({
    notificationTypes: {
      type: new GraphQLList(NotificationTypesEnum),
      description: "Notification types to return",
    },
  }),
  resolve: async (_root, args, { notificationsFeedLoader }) => {
    if (!notificationsFeedLoader) return null

    const { page, size, offset } = convertConnectionArgsToGravityArgs(args)

    const body = await notificationsFeedLoader({
      activity_types: args.notificationTypes,
      size,
      page,
    })

    return {
      counts: { total: body.total, unread: body.total_unread },
      totalCount: body.total,
      pageCursors: createPageCursors({ page, size }, body.total),
      ...connectionFromArraySlice(
        body.feed,
        pick(args, "before", "after", "first", "last"),
        {
          arrayLength: body.total,
          sliceStart: offset,
        }
      ),
    }
  },
}
