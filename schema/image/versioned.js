import { GraphQLString } from 'graphql';

export default {
  args: {
    version: {
      type: GraphQLString
    }
  },
  type: GraphQLString,
  resolve: ({ image_url }, { version }) => {
    return image_url.replace(':version', version);
  }
};
