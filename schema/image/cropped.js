import _ from 'lodash';
import proxy from './proxies';
import {
  GraphQLObjectType,
  GraphQLInt,
  GraphQLString,
  GraphQLNonNull,
} from 'graphql';

export const croppedImageUrl = (image, options) => {
  const opts = _.defaults(options, {
    version: 'large',
  });

  const { width, height } = opts;

  let src = null;
  if (image.image_url) {
    src = image.image_url.replace(':version', opts.version);
  } else {
    src = image;
  }

  const url = proxy(src, 'crop', width, height);
  return {
    width,
    height,
    url,
  };
};

const CroppedImageUrlType = new GraphQLObjectType({
  name: 'CroppedImageUrl',
  fields: {
    width: {
      type: GraphQLInt,
    },
    height: {
      type: GraphQLInt,
    },
    url: {
      type: GraphQLString,
    },
  },
});

export default {
  args: {
    width: {
      type: new GraphQLNonNull(GraphQLInt),
    },
    height: {
      type: new GraphQLNonNull(GraphQLInt),
    },
    version: {
      type: GraphQLString,
    },
  },
  type: CroppedImageUrlType,
  resolve: croppedImageUrl,
};
