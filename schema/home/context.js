import { create, assign } from 'lodash';
import gravity from '../../lib/loaders/gravity';
import {
  featuredAuction,
  featuredFair,
  featuredGene,
  popularArtists,
} from './fetch';
import Fair from '../fair';
import Sale from '../sale/index';
import Gene from '../gene';
import Artist from '../artist/index';
import FollowArtists from '../me/follow_artists';
import Trending from '../trending';
import { GraphQLUnionType, GraphQLObjectType } from 'graphql';

export const HomePageModuleContextFairType = create(Fair.type, {
  name: 'HomePageModuleContextFair',
  isTypeOf: ({ context_type }) => context_type === 'Fair',
});

export const HomePageModuleContextSaleType = create(Sale.type, {
  name: 'HomePageModuleContextSale',
  isTypeOf: ({ context_type }) => context_type === 'Sale',
});

export const HomePageModuleContextGeneType = create(Gene.type, {
  name: 'HomePageModuleContextGene',
  isTypeOf: ({ context_type }) => context_type === 'Gene',
});

export const HomePageModuleContextTrendingType = create(Trending.type, {
  name: 'HomePageModuleContextTrending',
  isTypeOf: ({ context_type }) => context_type === 'Trending',
});

export const HomePageModuleContextFollowArtistsType = create(FollowArtists.type, {
  name: 'HomePageModuleContextFollowArtists',
  isTypeOf: ({ context_type }) => context_type === 'FollowArtists',
});

export const HomePageModuleContextRelatedArtistType = new GraphQLObjectType({
  name: 'HomePageModuleContextRelatedArtist',
  fields: () => ({
    artist: {
      type: Artist.type,
    },
    based_on: {
      type: Artist.type,
    },
  }),
  isTypeOf: ({ context_type }) => context_type === 'RelatedArtist',
});

export const HomePageModuleContextFollowedArtistType = new GraphQLObjectType({
  name: 'HomePageModuleContextFollowedArtist',
  fields: () => ({
    artist: {
      type: Artist.type,
    },
  }),
  isTypeOf: ({ context_type }) => context_type === 'FollowedArtist',
});

export const moduleContext = {
  popular_artists: () => {
    return popularArtists().then((trending) => {
      return assign({}, trending, { context_type: 'Trending' });
    });
  },
  active_bids: () => null,
  followed_artists: ({ accessToken }) => {
    return gravity.with(accessToken)('me/follow/artists', { size: 9, page: 1 })
      .then((artists) => {
        return assign({}, { artists }, { context_type: 'FollowArtists' });
      });
  },
  followed_galleries: () => null,
  saved_works: () => null,
  recommended_works: () => null,
  live_auctions: () => {
    return featuredAuction().then((sale) => {
      return assign({}, sale, { context_type: 'Sale' });
    });
  },
  current_fairs: () => {
    return featuredFair().then((fair) => {
      return assign({}, fair, { context_type: 'Fair' });
    });
  },
  followed_artist: ({ params }) => {
    return gravity(`artist/${params.followed_artist_id}`).then((artist) => {
      return assign({}, {
        context_type: 'FollowedArtist',
        artist,
      });
    });
  },
  related_artists: ({ params }) => {
    return Promise.all([
      gravity(`artist/${params.related_artist_id}`),
      gravity(`artist/${params.followed_artist_id}`),
    ]).then(([related_artist, follow_artist]) => {
      return assign({}, {
        context_type: 'RelatedArtist',
        based_on: follow_artist,
        artist: related_artist,
      });
    });
  },
  genes: ({ accessToken, params: { gene } }) => {
    if (gene) {
      return assign({}, gene, { context_type: 'Gene' });
    }
    // Backward compatibility for Force.
    return featuredGene(accessToken).then((fetchedGene) => {
      return assign({}, fetchedGene, { context_type: 'Gene' });
    });
  },
  generic_gene: ({ params }) => {
    return gravity(`gene/${params.gene_id}`).then((gene) => {
      return assign({}, gene, { context_type: 'Gene' });
    });
  },
};

export default {
  type: new GraphQLUnionType({
    name: 'HomePageModuleContext',
    types: [
      HomePageModuleContextFairType,
      HomePageModuleContextSaleType,
      HomePageModuleContextGeneType,
      HomePageModuleContextTrendingType,
      HomePageModuleContextFollowArtistsType,
      HomePageModuleContextRelatedArtistType,
      HomePageModuleContextFollowedArtistType,
    ],
  }),
  resolve: ({ key, display, params }, options, request, { rootValue: { accessToken } }) => {
    return moduleContext[key]({ accessToken, params: (params || {}) });
  },
};
