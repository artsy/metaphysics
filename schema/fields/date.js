import moment from 'moment';
import * as tz from 'moment-timezone'; // eslint-disable-line no-unused-var
import { GraphQLString } from 'graphql';

export default {
  type: GraphQLString,
  args: {
    format: {
      type: GraphQLString,
    },
    timezone: {
      type: GraphQLString,
    },
  },
  resolve: (obj, { format, timezone }, { fieldName }) => {
    if (!format) return obj[fieldName];
    if (timezone) {
      return moment(obj[fieldName]).tz(timezone).format(format);
    }
    return moment.utc(obj[fieldName]).format(format);
  },
};
