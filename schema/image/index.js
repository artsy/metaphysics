import VersionedUrl from './versioned';
import CroppedUrl from './cropped';
import ResizedUrl from './resized';
import { isZoomable, default as DeepZoom } from './deep_zoom';
import normalize from './normalize';
import {
  GraphQLObjectType,
  GraphQLString,
  GraphQLList,
  GraphQLFloat,
  GraphQLInt,
  GraphQLBoolean,
} from 'graphql';

const ImageType = new GraphQLObjectType({
  name: 'Image',
  fields: () => ({
    id: {
      type: GraphQLString,
    },
    href: {
      type: GraphQLString,
    },
    title: {
      type: GraphQLString,
    },
    width: {
      type: GraphQLInt,
      resolve: ({ original_width }) => original_width,
    },
    height: {
      type: GraphQLInt,
      resolve: ({ original_height }) => original_height,
    },
    orientation: {
      type: GraphQLString,
      resolve: ({ original_height, original_width }) => {
        if (original_width === original_height) return 'square';
        return (original_width > original_height) ? 'landscape' : 'portrait';
      },
    },
    aspect_ratio: {
      type: GraphQLFloat,
    },
    versions: {
      type: new GraphQLList(GraphQLString),
      resolve: ({ image_versions }) => image_versions,
    },
    caption: {
      type: GraphQLString,
    },
    is_default: {
      type: GraphQLBoolean,
    },
    position: {
      type: GraphQLInt,
    },
    url: VersionedUrl,
    cropped: CroppedUrl,
    resized: ResizedUrl,
    deep_zoom: DeepZoom,
    is_zoomable: {
      type: GraphQLBoolean,
      resolve: isZoomable,
    },
    placeholder: {
      type: GraphQLString,
      description: 'Value to use when `padding-bottom` for fluid image placeholders',
      resolve: ({ original_height, original_width }) =>
        `${(original_height / original_width) * 100}%`,
    },
  }),
});

export default {
  type: ImageType,
  resolve: normalize,
};
