import marked from 'marked';
import { GraphQLString } from 'graphql';
import { isExisty } from '../../lib/helpers';
import Format from '../input_fields/format';

export default (fn) => ({
  type: GraphQLString,
  args: {
    format: Format,
  },
  resolve: (obj, { format }, { fieldName }) => {
    const value = fn ? fn(obj) : obj[fieldName];

    if (!isExisty(value)) return null;

    if (format === 'html' || format === 'markdown') {
      const renderer = new marked.Renderer;
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
  },
});
