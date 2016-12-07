import { map } from 'lodash';
import { exclude } from '../../lib/helpers';
import moment from 'moment';
import gravity from '../../lib/loaders/gravity';
import cached from '../fields/cached';
import date from '../fields/date';
import Artwork from '../artwork';
import SaleArtwork from '../sale_artwork';
import Profile from '../profile';
import Image from '../image/index';
import { amount } from '../fields/money';
import { GravityIDFields } from '../object_identification';
import {
  GraphQLString,
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLList,
  GraphQLBoolean,
  GraphQLInt,
  GraphQLFloat,
} from 'graphql';

const BidIncrement = new GraphQLObjectType({
  name: 'BidIncrement',
  fields: {
    from: {
      type: GraphQLInt,
    },
    to: {
      type: GraphQLInt,
    },
    amount: {
      type: GraphQLInt,
    },
  },
});

const BuyersPremium = new GraphQLObjectType({
  name: 'BuyersPremium',
  fields: {
    amount: amount(({ cents }) => cents),
    cents: {
      type: GraphQLInt,
      resolve: ({ cents }) => cents,
    },
    percent: {
      type: GraphQLFloat,
    },
  },
});

const SaleType = new GraphQLObjectType({
  name: 'Sale',
  fields: () => {
    return {
      ...GravityIDFields,
      cached,
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
        resolve: ({ auction_state }) =>
          auction_state === 'preview',
      },
      is_open: {
        type: GraphQLBoolean,
        resolve: ({ auction_state }) =>
          auction_state === 'open',
      },
      is_live_open: {
        type: GraphQLBoolean,
        resolve: ({ auction_state, live_start_at }) => {
          const liveStart = moment(live_start_at);
          return (
            auction_state === 'open' &&
            (moment().isAfter(liveStart) || moment().isSame(liveStart))
          );
        },
      },
      is_closed: {
        type: GraphQLBoolean,
        resolve: ({ auction_state }) =>
          auction_state === 'closed',
      },
      is_with_buyers_premium: {
        type: GraphQLBoolean,
        resolve: ({ buyers_premium }) => buyers_premium,
      },
      auction_state: {
        type: GraphQLString,
        resolve: ({ auction_state }) => auction_state,
        deprecationReason: 'Favor `status` for consistency with other models',
      },
      status: {
        type: GraphQLString,
        resolve: ({ auction_state }) => auction_state,
      },
      registration_ends_at: date,
      start_at: date,
      end_at: date,
      live_start_at: date,
      event_start_at: date,
      event_end_at: date,
      currency: {
        type: GraphQLString,
      },
      sale_artworks: {
        type: new GraphQLList(SaleArtwork.type),
        args: {
          page: {
            type: GraphQLInt,
            defaultValue: 1,
          },
          size: {
            type: GraphQLInt,
            defaultValue: 25,
          },
          all: {
            type: GraphQLBoolean,
            defaultValue: false,
          },
        },
        resolve: ({ id }, options) => {
          if (options.all) {
            return gravity.all(`sale/${id}/sale_artworks`, options);
          }

          return gravity(`sale/${id}/sale_artworks`, options);
        },
      },
      artworks: {
        type: new GraphQLList(Artwork.type),
        args: {
          page: {
            type: GraphQLInt,
            defaultValue: 1,
          },
          size: {
            type: GraphQLInt,
            defaultValue: 25,
          },
          all: {
            type: GraphQLBoolean,
            defaultValue: false,
          },
          exclude: {
            type: new GraphQLList(GraphQLString),
            description: 'List of artwork IDs to exclude from the response (irrespective of size)',
          },
        },
        resolve: ({ id }, options) => {
          const invert = saleArtworks => map(saleArtworks, 'artwork');

          if (options.all) {
            return gravity.all(`sale/${id}/sale_artworks`, options)
              .then(invert)
              .then(exclude(options.exclude, 'id'));
          }

          return gravity(`sale/${id}/sale_artworks`, options)
            .then(invert)
            .then(exclude(options.exclude, 'id'));
        },
      },
      cover_image: {
        type: Image.type,
        resolve: ({ image_versions, image_url }) =>
          Image.resolve({ image_versions, image_url }),
      },
      sale_artwork: {
        type: SaleArtwork.type,
        args: {
          id: {
            type: new GraphQLNonNull(GraphQLString),
          },
        },
        resolve: (sale, { id }) =>
          gravity(`sale/${sale.id}/sale_artwork/${id}`),
      },
      profile: {
        type: Profile.type,
        resolve: ({ profile }) => profile,
      },
      bid_increments: {
        type: new GraphQLList(BidIncrement),
        description: 'A bid increment policy that explains minimum bids in ranges.',
        resolve: (sale) =>
          gravity(`increments`, { key: sale.increment_strategy })
            .then((incs) => incs[0].increments),
      },
      buyers_premium: {
        type: new GraphQLList(BuyersPremium),
        description: "Auction's buyer's premium policy.",
        resolve: sale => {
          if (!sale.buyers_premium) return null;

          return map(sale.buyers_premium.schedule, item => ({
            cents: item.min_amount_cents,
            symbol: sale.currency,
            percent: item.percent,
          }));
        },
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
