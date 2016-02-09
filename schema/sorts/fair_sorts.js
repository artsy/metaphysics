import { GraphQLEnumType } from 'graphql';

export default {
  type: new GraphQLEnumType({
    name: 'FairSorts',
    values: {
      created_at_asc: {
        value: 'created_at',
      },
      created_at_desc: {
        value: '-created_at',
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
    },
  }),
};
