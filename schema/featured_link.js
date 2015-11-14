import Image from './image';
import {
  GraphQLString,
  GraphQLObjectType
} from 'graphql';

let FeaturedLinkType = new GraphQLObjectType({
  name: 'FeaturedLink',
  fields: {
    id: {
      type: GraphQLString,
      description: 'Attempt to get the ID of the entity of the FeaturedLink',
      resolve: ({ href }) => href.split('/').pop().split('?')[0]
    },
    title: {
      type: GraphQLString
    },
    subtitle: {
      type: GraphQLString
    },
    href: {
      type: GraphQLString
    },
    image: {
      type: Image.type,
      resolve: (featuredLink) => featuredLink
    }
  }
});

export default {
  type: FeaturedLinkType
};
