import marked from 'marked';
import { defaults } from 'lodash';
import { GraphQLString } from 'graphql';
import Format from '../input_fields/format';

export default (attr) => ({
  type: GraphQLString,
  args: {
    format: Format,
  },
  resolve: (obj, options, { fieldName }) => {
    const value = obj[attr || fieldName];

    if (!value) return null;

    if (options.format === 'markdown') {
      const renderer = new marked.Renderer;
      marked.setOptions(defaults(options, {
        renderer,
        gfm: true,
        tables: true,
        breaks: true,
        pedantic: false,
        sanitize: false,
        smartypants: false,
      }));
      return marked(value);
    }

    return value;
  },
});
