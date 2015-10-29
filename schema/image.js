import _ from 'lodash';
import qs from 'qs';
import {
  GraphQLObjectType,
  GraphQLString,
  GraphQLList,
  GraphQLFloat,
  GraphQLInt
} from 'graphql';

let { GEMINI_ENDPOINT } = process.env;

export let ResizedImageUrl = (image, options) => {
  let factor = _.min(_.map(options, (value, attr) => {
    return value / image[`original_${attr}`];
  }));

  let width = Math.floor(image.original_width * factor);
  let height = Math.floor(image.original_height * factor);
  let src = image.image_url.replace(':version', 'large');
  let url = `${GEMINI_ENDPOINT}/?${qs.stringify({
    resize_to: 'fit',
    height: height,
    width: width,
    quality: 95,
    src: src
  })}`;

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
