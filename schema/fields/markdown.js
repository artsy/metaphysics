/* @flow */

import marked from 'marked';
import { GraphQLString } from 'graphql';

import Format from '../input_fields/format';
import { isExisty } from '../../lib/helpers';

export function formatMarkdownValue(value, format) {
  if (format === 'html' || format === 'markdown') {
    const renderer = new marked.Renderer();
    marked.setOptions({
      renderer,
      gfm: true,
      tables: true,
      breaks: true,
      pedantic: false,
      sanitize: false,
      smartypants: false,
    });
    return marked(value);
  }

  return value;
}

export function markdown(fn) {
  return {
    type: GraphQLString,
    args: {
      format: Format,
    },
    resolve: (obj, { format }, { fieldName }) => {
      const value = fn ? fn(obj) : obj[fieldName];

      if (!isExisty(value)) return null;
      return formatMarkdownValue(value, format);
    },
  };
}
