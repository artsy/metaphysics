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
import {
  GraphQLString,
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLList,
  GraphQLBoolean,
  GraphQLInt,
  GraphQLFloat,
} from 'graphql';

export function auctionState({ start_at, end_at, live_start_at }) {
  const start = moment(start_at);
  const end = moment(end_at);
  const liveStart = moment(live_start_at);
  if (moment().isAfter(end) || moment().isSame(end)) {
    return 'closed';
  } else if (moment().isBetween(liveStart, end)) {
    return 'live';
  } else if (moment().isBetween(start, end)) {
    return 'open';
  } else if (moment().isBefore(start) || moment().isSame(start)) {
    return 'preview';
  }
}

const BidIncrement = new GraphQLObjectType({
  name: 'BidIncrements',
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
          auctionState(sale) === 'open' || auctionState(sale) === 'live',
      },
      is_live_open: {
        type: GraphQLBoolean,
        resolve: (sale) =>
          auctionState(sale) === 'live',
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
        deprecationReason: 'Favor `status` for consistency with other models',
      },
      status: {
        type: GraphQLString,
        resolve: auctionState,
      },
      registration_ends_at: date,
      start_at: date,
      end_at: date,
      live_start_at: date,
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
        resolve: (sale) => map(sale.buyers_premium.schedule, (item) => ({
          cents: item.min_amount_cents,
          symbol: sale.currency,
          percent: item.percent,
        })),
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
