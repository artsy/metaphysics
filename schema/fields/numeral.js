import inflect from 'i';
import numeral from 'numeral';
import FormattedNumber from '../types/formatted_number';
import { GraphQLString } from 'graphql';

const { pluralize } = inflect();

export default fn => ({
  type: FormattedNumber,
  args: {
    format: {
      type: GraphQLString,
      description: 'Returns a `String` when format is specified. e.g.`"0,0.0000"`',
    },
    label: {
      type: GraphQLString,
    },
  },
  resolve: (obj, { format, label }, { fieldName }) => {
    let value = fn ? fn(obj) : obj[fieldName];

    if (!value) return null;

    if (!!format) {
      value = numeral(value).format(format);
    }

    if (!!label) {
      value = `${value} ${pluralize(label)}`;
    }

    return value;
  },
});
