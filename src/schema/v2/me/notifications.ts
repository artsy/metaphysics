import date from "schema/v2/fields/date"
import Artwork from "schema/v2/artwork"
import Image, { normalizeImageData } from "schema/v2/image"
import {
  GraphQLEnumType,
  GraphQLList,
  GraphQLObjectType,
  GraphQLString,
  GraphQLFieldConfig,
} from "graphql"
import { GlobalIDField, NodeInterface } from "schema/v2/object_identification"
import { ResolverContext } from "types/graphql"

const NotificationsFeedItemType = new GraphQLObjectType<any, ResolverContext>({
  name: "NotificationsFeedItem",
  interfaces: [NodeInterface],
  fields: () => ({
    id: GlobalIDField,
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

const Notifications: GraphQLFieldConfig<void, ResolverContext> = {}

export default Notifications
