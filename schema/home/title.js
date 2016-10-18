import {
  featuredAuction,
  featuredFair,
  featuredGene,
} from './fetch';
import gravity from '../../lib/loaders/gravity';
import { GraphQLString } from 'graphql';

const moduleTitle = {
  active_bids: () => 'Your Active Bids',
  iconic_artists: () => 'Works by Iconic Artists',
  followed_artists: () => 'Works by Artists you Follow',
  followed_galleries: () => 'Works from Galleries You Follow',
  saved_works: () => 'Recently Saved Works',
  recommended_works: () => 'Recommended Works for You',
  live_auctions: () => {
    return featuredAuction().then((auction) => {
      if (auction) {
        return `Current Auction: ${auction.name}`;
      }
    });
  },
  current_fairs: () => {
    return featuredFair().then((fair) => {
      if (fair) {
        return `Current Fair: ${fair.name}`;
      }
    });
  },
  related_artists: ({ params }) => {
    return gravity(`artist/${params.related_artist_id}`).then((artist) => {
      return `Works by ${artist.name}`;
    });
  },
  genes: ({ accessToken }) => {
    return featuredGene(accessToken).then((gene) => {
      if (gene) {
        return gene.name;
      }
    });
  },
  generic_gene: ({ params }) => {
    return params.title;
  },
};

export default {
  type: GraphQLString,
  resolve: ({ key, display, params }, options, request, { rootValue: { accessToken } }) => {
    if (display) return moduleTitle[key]({ accessToken, params });
  },
};
