import {
  create,
  first,
  flatten,
} from 'lodash';
import { enhance } from '../../lib/helpers';
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

export const ArtworkContextPartnerShowType = create(PartnerShow.type, {
  name: 'ArtworkContextPartnerShow',
  isTypeOf: ({ context_type }) => context_type === 'PartnerShow',
});

export const ArtworkContextType = new GraphQLUnionType({
  name: 'ArtworkContext',
  types: [
    ArtworkContextFairType,
    ArtworkContextSaleType,
    ArtworkContextPartnerShowType,
  ],
});
export default {
  type: ArtworkContextType,
  description: 'Returns the associated Fair/Sale/PartnerShow',
  resolve: ({ id }) =>
    Promise
      .all([
        gravity('related/fairs', { artwork: [id], size: 1 }),
        gravity('related/sales', { artwork: [id], size: 1 }),
        gravity('related/shows', { artwork: [id], size: 1 }),
      ])
      .then(([fairs, sales, shows]) =>
        first(flatten([
          enhance(fairs, { context_type: 'Fair' }),
          enhance(sales, { context_type: 'Sale' }),
          enhance(shows, { context_type: 'PartnerShow' }),
        ]))
      ),
};
