import {
  assign,
} from 'lodash';

export function enhance(xs = [], source = {}) {
  return xs.map(x => assign(source, x));
}
