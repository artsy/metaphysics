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
import _ from "lodash"
import Image, { normalizeImageData } from "../image"

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
    headline: {
      type: new GraphQLNonNull(GraphQLString),
      resolve: ({ headline }) => headline,
    },
    title: {
      type: new GraphQLNonNull(GraphQLString),
      resolve: ({ actors }) => actors,
    },
    message: {
      type: new GraphQLNonNull(GraphQLString),
      resolve: ({ message }) => message,
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
    previewImages: {
      type: new GraphQLList(Image.type),
      args: {
        size: { type: GraphQLInt },
      },
      resolve: async (
        notification,
        { size },
        { articleLoader, artworksLoader, showsLoader, viewingRoomLoader }
      ) => {
        switch (notification.activity_type) {
          case "ViewingRoomPublishedActivity":
            const data = await viewingRoomLoader(notification.object_ids[0])

            return [
              normalizeImageData(
                data?.viewingRoom?.image?.imageURLs?.normalized
              ),
            ]
          case "ArticleFeaturedArtistActivity":
            const article = await articleLoader(notification.actor_ids[0])

            return [normalizeImageData(article?.thumbnail_image)]
          case "PartnerShowOpenedActivity":
            const shows = await showsLoader({
              size,
              id: notification.object_ids,
            })

            return shows.map(({ image_versions, image_url }) => {
              return normalizeImageData({
                image_versions,
                image_url,
              })
            })
          default:
            const artworks = await artworksLoader({
              ids: notification.object_ids,
              size,
            })

            return artworks.map((artwork) => artwork.images?.[0])
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
