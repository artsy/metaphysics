import gravity from '../../lib/loaders/gravity';
import date from '../fields/date';
import Artwork from '../artwork';
import {
  GraphQLEnumType,
  GraphQLList,
  GraphQLObjectType,
  GraphQLString,
  GraphQLInt,
} from 'graphql';

const NotificationsFeedItemType = new GraphQLObjectType({
  name: 'NotificationsFeedItem',
  fields: () => ({
    status: {
      type: new GraphQLEnumType({
        name: 'NotificationsFeedItemStatus',
        values: {
          READ: {
            value: 'read',
          },
          UNREAD: {
            value: 'unread',
          },
        },
      }),
    },
    artists: {
      type: GraphQLString,
      resolve: ({ actors }) => actors,
    },
    message: {
      type: GraphQLString,
    },
    date,
    artworks: {
      type: new GraphQLList(Artwork.type),
      description: 'List of artworks in this notification bundle',
      resolve: ({ object_ids }) => {
        return gravity('artworks', { ids: object_ids });
      },
    },
  }),
});

const Notifications = {
  type: new GraphQLList(NotificationsFeedItemType),
  description: 'A list of feed items, indicating published artworks (grouped by date and artists).',
  args: {
    size: {
      type: GraphQLInt,
      description: 'Number of feed items to return',
    },
    page: {
      type: GraphQLInt,
    },
  },
  resolve: (root, options, request, { rootValue: { accessToken } }) => {
    if (!accessToken) return null;
    return gravity.with(accessToken)('me/notifications/feed', options).then(({ feed }) => feed);
  },
};

export default Notifications;
