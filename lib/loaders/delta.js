import { toKey } from '../helpers';
import delta from '../apis/delta';
import httpLoader from './http';

export const deltaLoader = httpLoader(delta);

export default (path, options = {}) =>
  deltaLoader.load(toKey(path, options));
