import inflect from 'i';
import numeral from 'numeral';
import FormattedNumber from '../types/formatted_number';
import { GraphQLString } from 'graphql';

const { pluralize, singularize } = inflect();

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

    if (!value) {
      value = 0;
    }

    const count = value;

    if (!!format) {
      value = numeral(value).format(format);
    }

    if (!!label) {
      value = `${value} ${count === 1 ? singularize(label) : pluralize(label)}`;
    }

    return value;
  },
});
