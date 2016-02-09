import { GraphQLEnumType } from 'graphql';

export default {
  type: new GraphQLEnumType({
    name: 'FairSorts',
    values: {
      CREATED_AT_ASC: {
        value: 'created_at',
      },
      CREATED_AT_DESC: {
        value: '-created_at',
      },
      START_AT_ASC: {
        value: 'start_at',
      },
      START_AT_DESC: {
        value: '-start_at',
      },
      NAME_ASC: {
        value: 'name',
      },
      NAME_DESC: {
        value: '-name',
      },
    },
  }),
};
