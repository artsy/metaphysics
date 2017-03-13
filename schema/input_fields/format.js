import { GraphQLEnumType } from 'graphql';

export default {
  type: new GraphQLEnumType({
    name: 'Format',
    values: {
      HTML: {
        value: 'html',
      },
      PLAIN: {
        value: 'plain',
      },
      markdown: { // Deprecated
        value: 'markdown',
        deprecationReason: 'deprecated',
      },
    },
  }),
};
