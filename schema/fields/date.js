import moment from 'moment';
import { GraphQLString, GraphQLBoolean } from 'graphql';

export default {
  type: GraphQLString,
  args: {
    format: {
      type: GraphQLString,
    },
    convert_to_utc: {
      type: GraphQLBoolean,
      defaultValue: true,
    },
  },
  resolve: (obj, { format, convert_to_utc }, { fieldName }) => {
    if (!format) return obj[fieldName];
    if (convert_to_utc) {
      return moment.utc(obj[fieldName]).format(format);
    }
    return moment(obj[fieldName]).format(format);
  },
};
