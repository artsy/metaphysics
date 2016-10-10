/* @flow */

import { GraphQLEnumType } from 'graphql';

export default {
  type: new GraphQLEnumType({
    name: 'PartnerShowSorts',
    values: {
      created_at_asc: {
        value: 'created_at',
      },
      created_at_desc: {
        value: '-created_at',
      },
      end_at_asc: {
        value: 'end_at',
      },
      end_at_desc: {
        value: '-end_at',
      },
      start_at_asc: {
        value: 'start_at',
      },
      start_at_desc: {
        value: '-start_at',
      },
      name_asc: {
        value: 'name',
      },
      name_desc: {
        value: '-name',
      },
      publish_at_asc: {
        value: 'publish_at',
      },
      publish_at_desc: {
        value: '-publish_at',
      },
    },
  }),
};
