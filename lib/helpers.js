import {
  assign,
  negate,
  isEmpty,
  flow,
  camelCase,
} from 'lodash';

export function enhance(xs = [], source = {}) {
  return xs.map(x => assign({}, source, x));
}

export const isExisty = negate(isEmpty);

export const capitalizeFirstCharacter = x =>
  x.charAt(0).toUpperCase() + x.slice(1);

export const classify = flow(camelCase, capitalizeFirstCharacter);
