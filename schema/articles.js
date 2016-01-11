import positron from '../lib/loaders/positron';
import Article from './article';
import {
  GraphQLString,
  GraphQLBoolean,
  GraphQLList,
} from 'graphql';

const Articles = {
  type: new GraphQLList(Article.type),
  description: 'A list of Articles',
  args: {
    show_id: {
      type: GraphQLString,
    },
    published: {
      type: GraphQLBoolean,
      defaultValue: true,
    },
  },
  resolve: (root, options) => {
    return positron('articles', options).then(articles => articles.results);
  },
};

export default Articles;
