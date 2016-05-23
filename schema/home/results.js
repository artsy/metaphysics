import gravity from '../../lib/loaders/gravity';
import uncachedGravity from '../../lib/apis/gravity';
import {
  featuredAuction,
  featuredFair,
  featuredGene,
  iconicArtists,
} from './fetch';
import { map, assign, keys, without, shuffle, slice } from 'lodash';
import { toQueryString } from '../../lib/helpers';
import Artwork from '../artwork/index';
import {
  GraphQLList,
} from 'graphql';

const RESULTS_SIZE = 20;

const moduleResults = {
  active_bids: () => [],
  iconic_artists: () => {
    return iconicArtists().then((artists) => {
      const ids = without(keys(artists), 'cached', 'context_type');
      return uncachedGravity('filter/artworks?' + toQueryString({
        artist_ids: ids,
        size: 60,
        sort: '-partner_updated_at',
      })).then(({ body: { hits } }) => hits);
    });
  },
  followed_artists: ({ accessToken }) => {
    return gravity
      .with(accessToken)('me/follow/artists/artworks', {
        for_sale: true,
        size: 60,
      });
  },
  followed_galleries: ({ accessToken }) => {
    return gravity.with(accessToken)('me/follow/profiles/artworks', {
      for_sale: true,
      size: 60,
    }).then((artworks) => {
      return slice(shuffle(artworks), 0, RESULTS_SIZE);
    });
  },
  saved_works: ({ accessToken }) => {
    return gravity.with(accessToken)('me').then((user) => {
      return gravity
        .with(accessToken)('collection/saved-artwork/artworks', {
          size: RESULTS_SIZE,
          user_id: user.id,
          private: true,
          sort: '-position',
        });
    });
  },
  recommended_works: ({ accessToken }) => {
    return gravity.with(accessToken)('me/suggested/artworks/homepage', { limit: RESULTS_SIZE });
  },
  live_auctions: () => {
    return featuredAuction().then((auction) => {
      if (auction) {
        return gravity(`sale/${auction.id}/sale_artworks`, { size: RESULTS_SIZE })
          .then((sale_artworks) => {
            return map(sale_artworks, 'artwork');
          });
      }
    });
  },
  current_fairs: () => {
    return featuredFair().then((fair) => {
      if (fair) {
        return gravity('filter/artworks', {
          fair_id: fair.id,
          for_sale: true,
          size: 60,
        }).then(({ hits }) => {
          return slice(shuffle(hits), 0, RESULTS_SIZE);
        });
      }
    });
  },
  related_artists: () => [],
  genes: ({ accessToken }) => {
    return featuredGene(accessToken).then((gene) => {
      if (gene) {
        return gravity('filter/artworks', {
          gene_id: gene.id,
          for_sale: true,
          size: RESULTS_SIZE,
        }).then(({ hits }) => hits);
      }
    });
  },
  generic_gene: ({ params }) => {
    return gravity('filter/artworks', assign({}, params, { size: RESULTS_SIZE, for_sale: true }))
      .then(({ hits }) => hits);
  },
};

export default {
  type: new GraphQLList(Artwork.type),
  resolve: ({ key, display, params }, options, { rootValue: { accessToken } }) => {
    if (display) return moduleResults[key]({ accessToken, params });
  },
};
