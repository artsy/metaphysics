import { GraphQLEnumType } from 'graphql';

export default {
  type: new GraphQLEnumType({
    name: 'Format',
    values: {
      'markdown': { value: 'markdown' }
    }
  })
};