import _ from 'lodash';
import artsy from '../lib/artsy';
import {
  GraphQLObjectType,
  GraphQLString,
  GraphQLList,
  GraphQLFloat,
  GraphQLInt
} from 'graphql';

let ResizedImageUrl = (image, options) => {
  let factor = _.min(_.map(options, (value, attr) => {
    return value / image[`original_${attr}`];
  }));

  let width = Math.floor(image.original_width * factor);
  let height = Math.floor(image.original_height * factor);

  let url = `http://some_caching_resizing_cdn.com/${width}/${height}/${encodeURIComponent(image.image_url.replace(':version', 'original'))}`;

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
    factor: { type: GraphQLFloat },
    width: { type: GraphQLInt },
    height: { type: GraphQLInt },
    url: { type: GraphQLString }
  }
});

let ImageType = new GraphQLObjectType({
  name: 'Image',
  fields: () => ({
    id: { type: GraphQLString },
    width: { type: GraphQLInt, resolve: ({ original_width }) => original_width },
    height: { type: GraphQLInt, resolve: ({ original_height }) => original_height },
    aspect_ratio: { type: GraphQLFloat },
    url: {
      args: {
        width: { type: GraphQLInt },
        height: { type: GraphQLInt }
      },
      type: ResizedImageUrlType,
      resolve: (image, options) => ResizedImageUrl(image, options)
    }
  })
});

let Image = {
  type: ImageType
};

export default Image;
