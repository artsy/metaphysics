import positron from '../lib/loaders/positron';
import cached from './fields/cached';
import AuthorType from './author';
import Image from './image';
import date from './fields/date';
import ObjectIdentification from './object_identification';
import {
  GraphQLString,
  GraphQLObjectType,
  GraphQLNonNull,
} from 'graphql';

const ArticleType = new GraphQLObjectType({
  name: 'Article',
  interfaces: [ObjectIdentification.NodeInterface],
  fields: () => ({
    cached,
    __id: ObjectIdentification.GlobalIDField,
    id: {
      type: GraphQLString,
    },
    title: {
      type: GraphQLString,
    },
    published_at: date,
    updated_at: date,
    thumbnail_title: {
      type: GraphQLString,
    },
    thumbnail_teaser: {
      type: GraphQLString,
    },
    author: {
      type: AuthorType,
      resolve: ({ author }) => author,
    },
    thumbnail_image: {
      type: Image.type,
      resolve: ({ thumbnail_image }) => Image.resolve(thumbnail_image),
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
