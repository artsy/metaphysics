import _ from 'lodash';
import proxy from './proxies';
import {
  GraphQLObjectType,
  GraphQLFloat,
  GraphQLInt,
  GraphQLString,
  GraphQLNonNull
} from 'graphql';

export let CroppedImageUrl = (image, options) => {
  options = _.defaults(options, {
    version: 'large'
  });

  let { width, height } = options;
  let src = image.image_url.replace(':version', options.version);
  let url = proxy(src, 'crop', width, height);

  return {
    width,
    height,
    url
  };
};

let CroppedImageUrlType = new GraphQLObjectType({
  name: 'CroppedImageUrl',
  fields: {
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
      type: new GraphQLNonNull(GraphQLInt)
    },
    height: {
      type: new GraphQLNonNull(GraphQLInt)
    },
    version: {
      type: GraphQLString
    }
  },
  type: CroppedImageUrlType,
  resolve: CroppedImageUrl
};
