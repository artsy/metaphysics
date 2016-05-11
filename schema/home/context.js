import { create, assign } from 'lodash';
import {
  featuredAuction,
  featuredFair,
  featuredGene,
} from './fetch';
import Fair from '../fair';
import Sale from '../sale/index';
import Gene from '../gene';
import { GraphQLUnionType } from 'graphql';

export const HomePageModuleContextFairType = create(Fair.type, {
  name: 'HomePageModuleContextFair',
  isTypeOf: ({ context_type }) => context_type === 'Fair',
});

export const HomePageModuleContextSaleType = create(Sale.type, {
  name: 'HomePageModuleContextSale',
  isTypeOf: ({ context_type }) => context_type === 'Sale',
});

export const HomePageModuleContextGeneType = create(Gene.type, {
  name: 'HomePageModuleContextPartnerShow',
  isTypeOf: ({ context_type }) => context_type === 'Gene',
});

export const moduleContext = {
  active_bids: () => false,
  followed_artists: () => false,
  followed_galleries: () => false,
  saved_works: () => false,
  recommended_works: () => false,
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
  related_artists: () => false,
  genes: (accessToken) => {
    return featuredGene(accessToken).then((gene) => {
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
    ],
  }),
  resolve: ({ key, display }, options, { rootValue: { accessToken } }) => {
    return moduleContext[key](accessToken);
  },
};
