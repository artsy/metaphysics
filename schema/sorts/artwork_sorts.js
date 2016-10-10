/* @flow */

import { GraphQLEnumType } from 'graphql';

export default {
  type: new GraphQLEnumType({
    name: 'ArtworkSorts',
    values: {
      title_asc: {
        value: 'title',
      },
      title_desc: {
        value: '-title',
      },
      created_at_asc: {
        value: 'created_at',
      },
      created_at_desc: {
        value: '-created_at',
      },
      deleted_at_asc: {
        value: 'deleted_at',
      },
      deleted_at_desc: {
        value: '-deleted_at',
      },
      iconicity_desc: {
        value: '-iconicity',
      },
      merchandisability_desc: {
        value: '-merchandisability',
      },
      published_at_asc: {
        value: 'published_at',
      },
      published_at_desc: {
        value: '-published_at',
      },
      partner_updated_at_desc: {
        value: '-partner_updated_at',
      },
      availability_desc: {
        value: '-availability',
      },
    },
  }),
};
