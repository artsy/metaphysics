import moment from 'moment';
import * as tz from 'moment-timezone'; // eslint-disable-line no-unused-vars
import { GraphQLString, GraphQLBoolean } from 'graphql';

export function date(rawDate, format, timezone) {
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
    timezone: {
      type: GraphQLString,
      description: 'Specify a time zone for this field only, otherwise falls back to the timezone set in `X-TIMEZONE` header',
    },
    convert_to_utc: {
      type: GraphQLBoolean,
      deprecationReason: 'Use timezone instead',
    },
  },
  resolve: (obj,
    { format, timezone, ignoreTimezone },
    request,
    { fieldName, rootValue: { defaultTimezone } }
  ) => {
    const rawDate = obj[fieldName];
    const timezoneString = timezone ? timezone : defaultTimezone;
    return date(rawDate, format, timezoneString);
  },
};
