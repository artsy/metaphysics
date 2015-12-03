import _ from 'lodash';
import positron from '../lib/loaders/positron';
import cached from './fields/cached';
import AuthorType from './author';
import Image from './image'
import {
  GraphQLString,
  GraphQLObjectType,
  GraphQLNonNull,
} from 'graphql';

let ArticleType = new GraphQLObjectType({
  name: 'Article',
  fields: () => ({
    cached: cached,
    id: {
      type: GraphQLString
    },
    title: {
      type: GraphQLString
    },
    thumbnail_title: {
      type: GraphQLString
    },
    author: {
      type: AuthorType,
      resolve: ({ author }) => author
    },
    thumbnail_image: {
      type: Image.type,
      resolve: ({ thumbnail_image }) => thumbnail_image
    }
  })
});

let Article = {
  type: ArticleType,
  description: 'An Article',
  args: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: 'The ID of the Article'
    }
  },
  resolve: (root, { id }) => positron(`articles/${id}`)
};

export default Article;
