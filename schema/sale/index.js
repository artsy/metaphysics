import moment from 'moment';
import gravity from '../../lib/loaders/gravity';
import cached from '../fields/cached';
import date from '../fields/date';
import SaleArtwork from '../sale_artwork';
import Profile from '../profile';
import Image from '../image/index';
import {
  GraphQLString,
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLList,
  GraphQLBoolean,
} from 'graphql';

export function auctionState({ start_at, end_at }) {
  const start = moment(start_at);
  const end = moment(end_at);
  if (moment().isAfter(end) || moment().isSame(end)) {
    return 'closed';
  } else if (moment().isBetween(start, end)) {
    return 'open';
  } else if (moment().isBefore(start) || moment().isSame(start)) {
    return 'preview';
  }
}

const SaleType = new GraphQLObjectType({
  name: 'Sale',
  fields: () => {
    return {
      cached,
      id: {
        type: GraphQLString,
      },
      _id: {
        type: GraphQLString,
      },
      name: {
        type: GraphQLString,
      },
      href: {
        type: GraphQLString,
        resolve: ({ id }) => `/auction/${id}`,
      },
      description: {
        type: GraphQLString,
      },
      sale_type: {
        type: GraphQLString,
      },
      is_auction: {
        type: GraphQLBoolean,
      },
      is_auction_promo: {
        type: GraphQLBoolean,
        resolve: ({ sale_type }) => sale_type === 'auction promo',
      },
      is_preview: {
        type: GraphQLBoolean,
        resolve: (sale) =>
          auctionState(sale) === 'preview',
      },
      is_open: {
        type: GraphQLBoolean,
        resolve: (sale) =>
          auctionState(sale) === 'open',
      },
      is_closed: {
        type: GraphQLBoolean,
        resolve: (sale) =>
          auctionState(sale) === 'closed',
      },
      is_with_buyers_premium: {
        type: GraphQLBoolean,
        resolve: ({ buyers_premium }) => buyers_premium,
      },
      auction_state: {
        type: GraphQLString,
        resolve: auctionState,
      },
      start_at: date,
      end_at: date,
      currency: {
        type: GraphQLString,
      },
      sale_artworks: {
        type: new GraphQLList(SaleArtwork.type),
        resolve: ({ id }, options) => gravity(`sale/${id}/sale_artworks`, options),
      },
      cover_image: {
        type: Image.type,
        resolve: ({ image_versions, image_url }) => Image.resolve({ image_versions, image_url }),
      },
      sale_artwork: {
        type: SaleArtwork.type,
        args: {
          id: {
            type: new GraphQLNonNull(GraphQLString),
          },
        },
        resolve: (sale, { id }) => {
          return gravity(`sale/${sale.id}/sale_artwork/${id}`);
        },
      },
      profile: {
        type: Profile.type,
        resolve: ({ profile }) => profile,
      },
    };
  },
});

const Sale = {
  type: SaleType,
  description: 'A Sale',
  args: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: 'The slug or ID of the Sale',
    },
  },
  resolve: (root, { id }) => gravity(`sale/${id}`),
};

export default Sale;
