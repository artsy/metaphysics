import { take } from 'lodash';
import {
  GraphQLString,
  GraphQLInt,
} from 'graphql';

export function initials(string = '', length = 3) {
  const letters = take(string.match(/\b[A-Z]/g, ''), length);
  if (letters.length >= 1) return letters.join('').toUpperCase();
  return take(string.match(/\b\w/g, ''), length).join('').toUpperCase();
}

export default (attr) => ({
  type: GraphQLString,
  args: {
    length: {
      type: GraphQLInt,
      defaultValue: 3,
    },
  },
  resolve: (obj, { length }) => initials(obj[attr], length),
});
