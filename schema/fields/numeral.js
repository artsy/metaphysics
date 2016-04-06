import numeral from 'numeral';
import FormattedNumber from '../types/formatted_number';
import { GraphQLString } from 'graphql';

export default fn => ({
  type: FormattedNumber,
  args: {
    format: {
      type: GraphQLString,
    },
  },
  resolve: (obj, { format }, { fieldName }) => {
    const value = fn ? fn(obj) : obj[fieldName];

    if (!value) return null;
    if (!format) return value;

    return numeral(value).format(format);
  },
});
