import positron from '../lib/loaders/positron';
import cached from './fields/cached';
import AuthorType from './author';
import Image from './image';
import {
  GraphQLString,
  GraphQLObjectType,
  GraphQLNonNull,
} from 'graphql';

const ArticleType = new GraphQLObjectType({
  name: 'Article',
  fields: () => ({
    cached,
    id: {
      type: GraphQLString,
    },
    title: {
      type: GraphQLString,
    },
    thumbnail_title: {
      type: GraphQLString,
    },
    author: {
      type: AuthorType,
      resolve: ({ author }) => author,
    },
    thumbnail_image: {
      type: Image.type,
      resolve: ({ thumbnail_image }) => thumbnail_image,
    },
    slug: {
      type: GraphQLString,
    },
    href: {
      type: GraphQLString,
      resolve: ({ slug }) => `/article/${slug}`,
    },
  }),
});

const Article = {
  type: ArticleType,
  description: 'An Article',
  args: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: 'The ID of the Article',
    },
  },
  resolve: (root, { id }) => positron(`articles/${id}`),
};

export default Article;
