import {
  flow,
  assign,
  camelCase,
  isEmpty,
  isObject,
  isString,
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

export const capitalizeFirstCharacter = x =>
  x.charAt(0).toUpperCase() + x.slice(1);

export const classify = flow(camelCase, capitalizeFirstCharacter);
