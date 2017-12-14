import gravity from "lib/loaders/legacy/gravity"
import { pageable } from "relay-cursor-paging"
import { connectionDefinitions, connectionFromArraySlice } from "graphql-relay"
import date from "schema/fields/date"
import Artwork from "schema/artwork"
import Image from "schema/image"
import { GraphQLEnumType, GraphQLList, GraphQLObjectType, GraphQLString } from "graphql"
import { omit, has } from "lodash"
import { parseRelayOptions } from "lib/helpers"
import { GlobalIDField, NodeInterface } from "schema/object_identification"

const NotificationsFeedItemType = new GraphQLObjectType({
  name: "NotificationsFeedItem",
  interfaces: [NodeInterface],
  isTypeOf: obj => has(obj, "actors") && has(obj, "object_ids"),
  fields: () => ({
    __id: GlobalIDField,
    artists: {
      type: GraphQLString,
      resolve: ({ actors }) => actors,
    },
    artworks: {
      type: new GraphQLList(Artwork.type),
      description: "List of artworks in this notification bundle",
      resolve: ({ object_ids }) => {
        return gravity("artworks", { ids: object_ids })
      },
    },
    date,
    message: {
      type: GraphQLString,
    },
    status: {
      type: new GraphQLEnumType({
        name: "NotificationsFeedItemStatus",
        values: {
          READ: {
            value: "read",
          },
          UNREAD: {
            value: "unread",
          },
        },
      }),
    },
    image: {
      type: Image.type,
      resolve: ({ object }) => object.artists.length > 0 && Image.resolve(object.artists[0]),
    },
  }),
})

const Notifications = {
  type: connectionDefinitions({ nodeType: NotificationsFeedItemType }).connectionType,
  description: "A list of feed items, indicating published artworks (grouped by date and artists).",
  args: pageable({}),
  deprecationReason: "Prefer to use followed_artists_artwork_groups.",
  resolve: (root, options, request, { rootValue: { accessToken } }) => {
    if (!accessToken) return null
    const gravityOptions = parseRelayOptions(options)
    return gravity
      .with(accessToken)("me/notifications/feed", omit(gravityOptions, "offset"))
      .then(({ feed, total }) =>
        connectionFromArraySlice(feed, options, {
          arrayLength: total,
          sliceStart: gravityOptions.offset,
        })
      )
  },
}

export default Notifications
