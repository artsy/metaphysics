import {
  assign,
  create,
  first,
  flow,
  compact,
} from 'lodash';
import gravity from '../../lib/loaders/gravity';
import Fair from '../fair';
import Sale from '../sale/index';
import PartnerShow from '../partner_show';
import { GraphQLUnionType } from 'graphql';

export const ArtworkContextFairType = create(Fair.type, {
  name: 'ArtworkContextFair',
  isTypeOf: ({ context_type }) => context_type === 'Fair',
});

export const ArtworkContextSaleType = create(Sale.type, {
  name: 'ArtworkContextSale',
  isTypeOf: ({ context_type }) => context_type === 'Sale',
});

export const ArtworkContextAuctionType = create(Sale.type, {
  name: 'ArtworkContextAuction',
  isTypeOf: ({ context_type }) => context_type === 'Auction',
});

export const ArtworkContextPartnerShowType = create(PartnerShow.type, {
  name: 'ArtworkContextPartnerShow',
  isTypeOf: ({ context_type }) => context_type === 'PartnerShow',
});

export const ArtworkContextType = new GraphQLUnionType({
  name: 'ArtworkContext',
  types: [
    ArtworkContextAuctionType,
    ArtworkContextSaleType,
    ArtworkContextFairType,
    ArtworkContextPartnerShowType,
  ],
});

const choose = flow(compact, first);

export default {
  type: ArtworkContextType,
  description: 'Returns the associated Fair/Sale/PartnerShow',
  resolve: ({ id, sale_ids }) => {
    let sale_promise = Promise.resolve(null);
    if (sale_ids && sale_ids.length > 0) {
      sale_promise = gravity('sales', { id: sale_ids })
        .then(first)
        .then(sale => {
          if (!sale) return null;
          return assign({ context_type: sale.is_auction ? 'Auction' : 'Sale' }, sale);
        });
    }

    const fair_promise = gravity('related/fairs', { artwork: [id], size: 1 })
      .then(first)
      .then(fair => {
        if (!fair || fair && !fair.has_full_feature) return null;
        return assign({ context_type: 'Fair' }, fair);
      });

    const show_promise = gravity('related/shows', {
      artwork: [id],
      size: 1,
      active: false,
      at_a_fair: false,
    })
      .then(first)
      .then(show => {
        if (!show) return null;
        return assign({ context_type: 'PartnerShow' }, show);
      });

    return Promise
      .all([sale_promise, fair_promise, show_promise])
      .then(choose);
  },
};
