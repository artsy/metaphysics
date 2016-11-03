/* @flow */

import { GraphQLEnumType } from 'graphql';

export default {
  type: new GraphQLEnumType({
    name: 'SaleSorts',
    values: {
      _ID_ASC: {
        value: '_id',
      },
      _ID_DESC: {
        value: '-_id',
      },
      NAME_ASC: {
        value: 'name',
      },
      NAME_DESC: {
        value: '-name',
      },
      CREATED_AT_ASC: {
        value: 'created_at',
      },
      CREATED_AT_DESC: {
        value: '-created_at',
      },
      END_AT_ASC: {
        value: 'end_at',
      },
      END_AT_DESC: {
        value: '-end_at',
      },
      START_AT_ASC: {
        value: 'start_at',
      },
      START_AT_DESC: {
        value: '-start_at',
      },
      ELIGIBLE_SALE_ARTWORKS_COUNT_ASC: {
        value: 'eligible_sale_artworks_count',
      },
      ELIGIBLE_SALE_ARTWORKS_COUNT_DESC: {
        value: '-eligible_sale_artworks_count',
      },
    },
  }),
};
