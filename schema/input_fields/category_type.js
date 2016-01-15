import { GraphQLEnumType } from 'graphql';

export default {
  type: new GraphQLEnumType({
    name: 'CategoryType',
    values: {
      gallery: {
        value: 'Gallery',
      },
      institution: {
        value: 'institution',
      },
    },
  }),
};
