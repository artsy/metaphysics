/* @flow */

import { map } from 'lodash';
import {
  GraphQLInt,
  GraphQLString,
  GraphQLObjectType,
} from 'graphql';

import {
  join,
  truncate,
} from '../../lib/helpers';
import { getDefault } from '../image';
import { setVersion } from '../image/normalize';

const titleWithDate = ({ title, date }) => join(' ', [
  title,
  date ? `(${date})` : undefined,
]);

const artistNames = artwork =>
  artwork.cultural_maker || map(artwork.artists, 'name').join(', ');

const forSaleIndication = artwork =>
  artwork.forsale ? 'Available for Sale' : undefined;

const dimensions = artwork =>
  artwork.dimensions[artwork.metric];

const partnerDescription = ({ partner: { name }, forsale }) => {
  if (!name) return undefined;
  return forsale ? `Available for sale from ${name}` : `From ${name}`;
};

const ArtworkMetaType = new GraphQLObjectType({
  name: 'ArtworkMeta',
  fields: {
    title: {
      type: GraphQLString,
      resolve: artwork => join(' | ', [
        artistNames(artwork),
        titleWithDate(artwork),
        forSaleIndication(artwork),
        'Artsy',
      ]),
    },
    description: {
      type: GraphQLString,
      args: {
        limit: {
          type: GraphQLInt,
          defaultValue: 155,
        },
      },
      resolve: (artwork, { limit }) => truncate(join(', ', [
        partnerDescription(artwork),
        artistNames(artwork),
        titleWithDate(artwork),
        artwork.medium,
        dimensions(artwork),
      ]), limit),
    },
    image: {
      type: GraphQLString,
      resolve: ({ images }) =>
        setVersion(getDefault(images), [
          'large',
          'medium',
          'tall',
        ]),
    },
  },
});

export default {
  type: ArtworkMetaType,
  resolve: x => x,
};
