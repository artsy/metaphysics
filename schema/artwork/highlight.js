/* @flow */

import { create } from 'lodash';
import { GraphQLUnionType } from 'graphql';

import Show from '../partner_show';
import Article from '../article';

export const HighlightedShowType = create(Show.type, {
  name: 'HighlightedShow',
  isTypeOf: ({ highlight_type }) => highlight_type === 'Show',
});

export const HighlightedArticleType = create(Article.type, {
  name: 'HighlightedArticle',
  isTypeOf: ({ highlight_type }) => highlight_type === 'Article',
});

export const HighlightType = new GraphQLUnionType({
  name: 'Highlighted',
  types: [
    HighlightedShowType,
    HighlightedArticleType,
  ],
});

export default HighlightType;
