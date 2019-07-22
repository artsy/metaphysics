import { pageable } from "relay-cursor-paging"
import { connectionDefinitions, connectionFromArraySlice } from "graphql-relay"
import date from "schema/v1/fields/date"
import Artwork from "schema/v1/artwork"
import Image, { normalizeImageData } from "schema/v1/image"
import {
  GraphQLEnumType,
  GraphQLList,
  GraphQLObjectType,
  GraphQLString,
  GraphQLFieldConfig,
} from "graphql"
import { omit } from "lodash"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { GlobalIDField, NodeInterface } from "schema/v1/object_identification"
import { ResolverContext } from "types/graphql"
import { deprecate } from "lib/deprecation"

const NotificationsFeedItemType = new GraphQLObjectType<any, ResolverContext>({
  name: "NotificationsFeedItem",
  interfaces: [NodeInterface],
  fields: () => ({
    __id: GlobalIDField,
    artists: {
      type: GraphQLString,
      resolve: ({ actors }) => actors,
    },
    artworks: {
      type: new GraphQLList(Artwork.type),
      description: "List of artworks in this notification bundle",
      resolve: ({ object_ids }, _options, { artworksLoader }) => {
        return artworksLoader({ ids: object_ids })
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
      resolve: ({ object }) =>
        object.artists.length > 0 && normalizeImageData(object.artists[0]),
    },
  }),
})

const Notifications: GraphQLFieldConfig<void, ResolverContext> = {
  type: connectionDefinitions({ nodeType: NotificationsFeedItemType })
    .connectionType,
  description:
    "A list of feed items, indicating published artworks (grouped by date and artists).",
  args: pageable({}),
  deprecationReason: deprecate({
    inVersion: 2,
    preferUsageOf: "followed_artists_artwork_groups",
  }),
  resolve: (_root, options, { notificationsFeedLoader }) => {
    if (!notificationsFeedLoader) return null
    const gravityOptions = convertConnectionArgsToGravityArgs(options)
    return notificationsFeedLoader(omit(gravityOptions, "offset")).then(
      ({ feed, total }) =>
        connectionFromArraySlice(feed, options, {
          arrayLength: total,
          sliceStart: gravityOptions.offset,
        })
    )
  },
}

export default Notifications
