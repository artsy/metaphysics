import moment from 'moment';
import * as tz from 'moment-timezone'; // eslint-disable-line no-unused-vars
import { GraphQLString, GraphQLBoolean } from 'graphql';

export function date_tz_header(rawDate, format, timezone) {
  if (timezone) {
    if (format) return moment(rawDate).tz(timezone).format(format);
    return moment(rawDate).tz(timezone).format();
  }
  if (format) return moment.utc(rawDate).format(format);
  return rawDate;
}

export default {
  type: GraphQLString,
  args: {
    format: {
      type: GraphQLString,
    },
    ignoreTimezone: {
      type: GraphQLBoolean,
    },
  },

  resolve: (obj, { format, ignoreTimezone }, request, { fieldName, rootValue: { timezone } }) => {
    const rawDate = obj[fieldName];
    let timezoneString;
    if (timezone && !ignoreTimezone) { timezoneString = timezone; }
    return date_tz_header(rawDate, format, timezoneString);
  },
};
