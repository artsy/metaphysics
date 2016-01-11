import moment from 'moment';
import { GraphQLString } from 'graphql';

export default {
  type: GraphQLString,
  args: {
    format: {
      type: GraphQLString,
    },
  },
  resolve: (obj, { format }, { fieldName }) => {
    if (!format) return obj[fieldName];
    return moment.utc(obj[fieldName]).format(format);
  },
};
