/* @flow */

import {
  GraphQLList,
  GraphQLString,
} from 'graphql';

import { setVersion } from './normalize';

export const versionedImageUrl = (image, { version }) => {
  return setVersion(image, version);
};

export default {
  args: {
    version: {
      type: new GraphQLList(GraphQLString),
    },
  },
  type: GraphQLString,
  resolve: versionedImageUrl,
};
