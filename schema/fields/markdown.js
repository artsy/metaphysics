import marked from 'marked';
import _ from 'lodash';
import { GraphQLString, GraphQLBoolean } from 'graphql';
import Format from '../input_fields/format'

export default {
  type: GraphQLString,
  args: {
    format: Format
  },
  resolve: (obj, options, { fieldName }) => {
    if (options.format === 'markdown') {
      let renderer = new marked.Renderer;
      marked.setOptions(_.defaults(options, {
        renderer: renderer,
        gfm: true,
        tables: true,
        breaks: true,
        pedantic: false,
        sanitize: false,
        smartypants: false
      }));
      return marked(obj[fieldName] || '');
    } else {
      return obj[fieldName];
    };
  }
};
