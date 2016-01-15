import { setVersion } from './normalize';
import { GraphQLString } from 'graphql';

export const versionedImageUrl = (image, { version }) => {
  return setVersion(image, version);
};

export default {
  args: {
    version: {
      type: GraphQLString,
    },
  },
  type: GraphQLString,
  resolve: versionedImageUrl,
};
