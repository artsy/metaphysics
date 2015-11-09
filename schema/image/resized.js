import _ from 'lodash';
import proxy from './proxies';
import {
  GraphQLObjectType,
  GraphQLFloat,
  GraphQLInt,
  GraphQLString
} from 'graphql';

export let ResizedImageUrl = (image, options) => {
  options = _.defaults(options, {
    version: 'large'
  });

  let desired = _.pick(options, 'width', 'height');
  let factor = _.min(_.map(desired, (value, attr) => {
    return value / image[`original_${attr}`];
  }));

  let width = null;
  let height = null;

  if (_.isFinite(factor)) {
    width = Math.floor(image.original_width * factor);
    height = Math.floor(image.original_height * factor);
  }

  let src = image.image_url.replace(':version', options.version);
  let url = proxy(src, 'resize', (width || options.width), (height || options.height));

  return {
    factor,
    width,
    height,
    url
  };
};

let ResizedImageUrlType = new GraphQLObjectType({
  name: 'ResizedImageUrl',
  fields: {
    factor: {
      type: GraphQLFloat
    },
    width: {
      type: GraphQLInt
    },
    height: {
      type: GraphQLInt
    },
    url: {
      type: GraphQLString
    }
  }
});

export default {
  args: {
    width: {
      type: GraphQLInt
    },
    height: {
      type: GraphQLInt
    },
    version: {
      type: GraphQLString
    }
  },
  type: ResizedImageUrlType,
  resolve: ResizedImageUrl
};
