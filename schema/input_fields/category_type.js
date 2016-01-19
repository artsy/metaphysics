import { GraphQLEnumType } from 'graphql';

export default {
  type: new GraphQLEnumType({
    name: 'CategoryType',
    values: {
      GALLERY: {
        value: 'Gallery',
      },
      INSTITUTION: {
        value: 'Institution',
      },
    },
  }),
};
