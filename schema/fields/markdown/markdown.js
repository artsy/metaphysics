import { GraphQLString } from 'graphql';
import { isExisty } from '../../../lib/helpers';
import Format from '../../input_fields/format';
import formatMarkdownValue from './format_markdown_value';

export default (fn) => ({
  type: GraphQLString,
  args: {
    format: Format,
  },
  resolve: (obj, { format }, { fieldName }) => {
    const value = fn ? fn(obj) : obj[fieldName];

    if (!isExisty(value)) return null;
    formatMarkdownValue(value, format);
  },
});
