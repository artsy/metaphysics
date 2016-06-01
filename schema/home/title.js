import {
  featuredAuction,
  featuredFair,
  featuredGene,
  relatedArtist,
} from './fetch';
import { GraphQLString } from 'graphql';

const moduleTitle = {
  active_bids: () => 'Your Active Bids',
  iconic_artists: () => 'Works by Iconic Artists',
  followed_artists: () => 'Works by Artists you Follow',
  followed_galleries: () => 'Works from Galleries you Follow',
  saved_works: () => 'Recently Saved Works',
  recommended_works: () => 'Recommended Works for You',
  live_auctions: () => {
    return featuredAuction().then((auction) => {
      if (auction) {
        return `At Auction: ${auction.name}`;
      }
    });
  },
  current_fairs: () => {
    return featuredFair().then((fair) => {
      if (fair) {
        return `Art Fair: ${fair.name}`;
      }
    });
  },
  related_artists: ({ accessToken }) => {
    return relatedArtist(accessToken).then((related_artist) => {
      if (related_artist) {
        return related_artist.name;
      }
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
  resolve: ({ key, display, params }, options, { rootValue: { accessToken } }) => {
    if (display) return moduleTitle[key]({ accessToken, params });
  },
};
