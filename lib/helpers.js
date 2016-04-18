import { stringify } from 'qs';
import {
  flow,
  assign,
  camelCase,
  isEmpty,
  isObject,
  isString,
  compact,
} from 'lodash';

export function enhance(xs = [], source = {}) {
  return xs.map(x => assign({}, source, x));
}

export const isExisty = x => {
  // Return false on empty Objects
  if (isObject(x) && isEmpty(x)) return false;

  // Return false on empty Strings
  if (isString(x) && isEmpty(x)) return false;

  // Intentional use of loose equality operator (Fogus)
  return x != null; // eslint-disable-line eqeqeq
};

// Coerce a usable value or nothing at all
export const existyValue = x => {
  if (isExisty(x)) return x;
};

export const capitalizeFirstCharacter = x =>
  x.charAt(0).toUpperCase() + x.slice(1);

export const classify = flow(camelCase, capitalizeFirstCharacter);

export const join = (by, xs) => compact(xs).join(by);

export const truncate = (string, length, append = '…') => {
  const x = string + '';
  const limit = ~~length;
  return x.length > limit ? (x.slice(0, limit) + append) : x;
};

export const toQueryString = (options = {}) =>
  stringify(options, {
    arrayFormat: 'brackets',
    sort: (a, b) =>
      a.localeCompare(b),
  });

export const toKey = (path, options = {}) =>
  `${path}?${toQueryString(options)}`;
