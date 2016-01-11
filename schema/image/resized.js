import _ from 'lodash';
import proxy from './proxies';
import {
  GraphQLObjectType,
  GraphQLFloat,
  GraphQLInt,
  GraphQLString,
} from 'graphql';

export const resizedImageUrl = (image, options) => {
  const opts = _.defaults(options, {
    version: 'large',
  });

  const desired = _.pick(opts, 'width', 'height');
  const factor = _.min(_.map(desired, (value, attr) => {
    return value / image[`original_${attr}`];
  }));

  let width = null;
  let height = null;

  if (_.isFinite(factor)) {
    width = Math.floor(image.original_width * factor);
    height = Math.floor(image.original_height * factor);
  }

  const src = image.image_url.replace(':version', opts.version);
  const url = proxy(src, 'resize', (width || opts.width), (height || opts.height));

  return {
    factor,
    width,
    height,
    url,
  };
};

const ResizedImageUrlType = new GraphQLObjectType({
  name: 'ResizedImageUrl',
  fields: {
    factor: {
      type: GraphQLFloat,
    },
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
      type: GraphQLInt,
    },
    height: {
      type: GraphQLInt,
    },
    version: {
      type: GraphQLString,
    },
  },
  type: ResizedImageUrlType,
  resolve: resizedImageUrl,
};
