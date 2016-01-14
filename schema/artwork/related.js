import { create } from 'lodash';
import Fair from '../fair';
import Sale from '../sale';
import { GraphQLUnionType } from 'graphql';

export const RelatedFairType = create(Fair.type, {
  name: 'RelatedFair',
  isTypeOf: ({ related_type }) => related_type === 'Fair',
});

export const RelatedSaleType = create(Sale.type, {
  name: 'RelatedSale',
  isTypeOf: ({ related_type }) => related_type === 'Sale',
});

export const RelatedType = new GraphQLUnionType({
  name: 'Related',
  types: [
    RelatedFairType,
    RelatedSaleType,
  ],
});

export default RelatedType;
