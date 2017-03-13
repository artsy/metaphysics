import { has } from 'lodash';
import positron from '../lib/loaders/positron';
import cached from './fields/cached';
import AuthorType from './author';
import Image from './image';
import date from './fields/date';
import { IDFields, NodeInterface } from './object_identification';
import {
  GraphQLString,
  GraphQLObjectType,
  GraphQLNonNull,
} from 'graphql';

const ArticleType = new GraphQLObjectType({
  name: 'Article',
  interfaces: [NodeInterface],
  isTypeOf: (obj) => has(obj, 'title') && has(obj, 'author'),
  fields: () => ({
    ...IDFields,
    cached,
    author: {
      type: AuthorType,
      resolve: ({ author }) => author,
    },
    href: {
      type: GraphQLString,
      resolve: ({ slug }) => `/article/${slug}`,
    },
    published_at: date,
    slug: {
      type: GraphQLString,
    },
    thumbnail_title: {
      type: GraphQLString,
    },
    thumbnail_teaser: {
      type: GraphQLString,
    },
    thumbnail_image: {
      type: Image.type,
      resolve: ({ thumbnail_image }) => Image.resolve(thumbnail_image),
    },
    title: {
      type: GraphQLString,
    },
    updated_at: date,
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
