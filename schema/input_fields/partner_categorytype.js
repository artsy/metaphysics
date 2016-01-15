import { GraphQLEnumType } from 'graphql';

export default {
  type: new GraphQLEnumType({
    name: 'PartnerCategorytype',
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
