import gravity from '../../lib/loaders/gravity';
import { pageable } from 'relay-cursor-paging';
import {
  connectionDefinitions,
  connectionFromArraySlice,
} from 'graphql-relay';
import date from '../fields/date';
import Artwork from '../artwork';
import Image from '../image';
import {
  GraphQLEnumType,
  GraphQLList,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql';
import { omit } from 'lodash';
import { parseRelayOptions } from '../../lib/helpers';

const NotificationsFeedItemType = new GraphQLObjectType({
  name: 'NotificationsFeedItem',
  fields: () => ({
    artists: {
      type: GraphQLString,
      resolve: ({ actors }) => actors,
    },
    artworks: {
      type: new GraphQLList(Artwork.type),
      description: 'List of artworks in this notification bundle',
      resolve: ({ object_ids }) => {
        return gravity('artworks', { ids: object_ids });
      },
    },
    date,
    message: {
      type: GraphQLString,
    },
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
    image: {
      type: Image.type,
      resolve: ({ object }) => object.artists.count > 0 && Image.resolve(object.artists[0]),
    },
  }),
});

const Notifications = {
  type: connectionDefinitions({ nodeType: NotificationsFeedItemType }).connectionType,
  description: 'A list of feed items, indicating published artworks (grouped by date and artists).',
  args: pageable({}),
  resolve: (root, options, request, { rootValue: { accessToken } }) => {
    if (!accessToken) return null;
    const gravityOptions = parseRelayOptions(options);
    return gravity.with(accessToken)('me/notifications/feed', omit(gravityOptions, 'offset'))
      .then(({ feed, total }) => connectionFromArraySlice(feed, options, {
        arrayLength: total,
        sliceStart: gravityOptions.offset,
      }));
  },
};

export default Notifications;
