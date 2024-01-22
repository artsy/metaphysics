import {
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLFieldConfig,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
  GraphQLInt,
} from "graphql"
import { connectionFromArray, connectionFromArraySlice } from "graphql-relay"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { pick } from "lodash"
import { pageable } from "relay-cursor-paging"
import { date, formatDate } from "schema/v2/fields/date"
import {
  connectionWithCursorInfo,
  createPageCursors,
} from "schema/v2/fields/pagination"
import { ResolverContext } from "types/graphql"
import { artworkConnection } from "../artwork"
import numeral from "../fields/numeral"
import { IDFields, NodeInterface } from "../object_identification"
import moment from "moment-timezone"
import { DEFAULT_TZ } from "lib/date"
import { NotificationItemType } from "./Item"

const NotificationTypesEnum = new GraphQLEnumType({
  name: "NotificationTypesEnum",
  values: {
    ARTICLE_FEATURED_ARTIST: { value: "ArticleFeaturedArtistActivity" },
    ARTWORK_ALERT: { value: "SavedSearchHitActivity" },
    ARTWORK_PUBLISHED: { value: "ArtworkPublishedActivity" },
    VIEWING_ROOM_PUBLISHED: { value: "ViewingRoomPublishedActivity" },
    PARTNER_SHOW_OPENED: { value: "PartnerShowOpenedActivity" },
    PARTNER_OFFER_CREATED: { value: "PartnerOfferCreatedActivity" },
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
    createdAt: {
      ...date(({ date }) => date),
      deprecationReason: "Please use `publishedAt` instead",
    },
    item: {
      type: NotificationItemType,
      resolve: (notification) => notification,
    },
    publishedAt: {
      type: new GraphQLNonNull(GraphQLString),
      args: {
        format: {
          type: GraphQLString,
          description:
            'pass `RELATIVE` to display the human-friendly date (e.g. "Today", "Yesterday", "5 days ago")',
        },
      },
      resolve: ({ date }, { format }, { defaultTimezone }) => {
        const timezone = defaultTimezone ?? DEFAULT_TZ
        const dateFormat = format ?? "YYYY-MM-DDTHH:mm:ss[Z]"

        if (format === "RELATIVE") {
          const today = moment.tz(moment(), timezone).startOf("day")
          const createdAt = moment.tz(date, timezone).startOf("day")
          const days = today.diff(createdAt, "days")

          if (days === 0) {
            return "Today"
          }

          if (days === 1) {
            return "Yesterday"
          }

          return `${days} days ago`
        }

        return formatDate(date, dateFormat, timezone)
      },
    },
    subject: {
      type: new GraphQLNonNull(GraphQLString),
      resolve: async (notification, _args, { artworksLoader }) => {
        switch (notification.activity_type) {
          case "ArtworkPublishedActivity":
            return `${notification.objects_count} New ${
              notification.objects_count === 1 ? "Work" : "Works"
            } by ${notification.actors}`
          case "SavedSearchHitActivity":
            return `${notification.objects_count} New ${notification.actors}`
          case "ArticleFeaturedArtistActivity":
            return notification.article?.title
          case "PartnerOfferCreatedActivity":
            // TODO: This is a hack to get the artwork's artist name. It's not good because we potentially request the artworks list twice without caching!
            const artworks = await artworksLoader({
              ids: notification.object_ids,
            })
            const artistName = artworks[0]?.artist?.name

            return `Saved work by ${artistName}`
          case "PartnerShowOpenedActivity":
            debugger
            return `${notification.message} by ${notification.actors}`
          case "ViewingRoomPublishedActivity":
            return `${notification.message} by ${notification.actors}`
          default:
            return ""
        }
      },
    },
    targetHref: {
      type: new GraphQLNonNull(GraphQLString),
      resolve: ({ target_href }) => target_href,
    },
    notificationType: {
      type: new GraphQLNonNull(NotificationTypesEnum),
      resolve: ({ activity_type }) => activity_type,
    },
    artworksConnection: {
      type: artworkConnection.connectionType,
      args: pageable(),
      resolve: async ({ object_ids: ids }, args, { artworksLoader }) => {
        const { page, size } = convertConnectionArgsToGravityArgs(args)
        return artworksLoader({ ids }).then((body) => {
          const totalCount = body.length
          return {
            totalCount,
            pageCursors: createPageCursors({ page, size }, totalCount),
            ...connectionFromArray(body, args),
          }
        })
      },
    },
    objectsCount: {
      type: new GraphQLNonNull(GraphQLInt),
      resolve: ({ objects_count }) => objects_count,
    },
  }),
})

const NotificationCounts = {
  type: new GraphQLObjectType<any, ResolverContext>({
    name: "NotificationCounts",
    fields: {
      total: numeral(({ total }) => total),
      unread: numeral(({ unread }) => unread),
      unseen: numeral(({ unseen }) => unseen),
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
      counts: {
        total: body.total,
        unread: body.total_unread,
        unseen: body.total_unseen,
      },
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
