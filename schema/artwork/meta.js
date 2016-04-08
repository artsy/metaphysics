import {
  map,
  find,
  first,
} from 'lodash';
import {
  join,
  truncate,
} from '../../lib/helpers';
import { setVersion } from '../image/normalize';
import {
  GraphQLInt,
  GraphQLString,
  GraphQLObjectType,
} from 'graphql';

const titleWithDate = ({ title, date }) => join(' ', [
  title,
  date ? `(${date})` : undefined,
]);

const artistNames = artwork =>
  map(artwork.artists, 'name').join(', ');

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
      resolve: ({ images }) => {
        const image = find(images, { is_default: true }) || first(images);
        return setVersion(image, ['large', 'medium', 'tall']);
      },
    },
  },
});

export default {
  type: ArtworkMetaType,
  resolve: x => x,
};
