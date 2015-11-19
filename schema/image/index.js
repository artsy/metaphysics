import VersionedUrl from './versioned';
import CroppedUrl from './cropped';
import ResizedUrl from './resized';
import {
  GraphQLObjectType,
  GraphQLString,
  GraphQLList,
  GraphQLFloat,
  GraphQLInt
} from 'graphql';

let ImageType = new GraphQLObjectType({
  name: 'Image',
  fields: () => ({
    id: {
      type: GraphQLString
    },
    href: {
      type: GraphQLString
    },
    width: {
      type: GraphQLInt,
      resolve: ({ original_width }) => original_width
    },
    height: {
      type: GraphQLInt,
      resolve: ({ original_height }) => original_height
    },
    aspect_ratio: {
      type: GraphQLFloat
    },
    versions: {
      type: new GraphQLList(GraphQLString),
      resolve: ({ image_versions }) => image_versions
    },
    caption: {
      type: GraphQLString
    },
    url: VersionedUrl,
    cropped: CroppedUrl,
    resized: ResizedUrl
  })
});

let Image = {
  type: ImageType
};

export default Image;
