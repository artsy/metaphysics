import { toKey } from '../helpers';
import galaxy from '../apis/galaxy';
import httpLoader from './http';

export const galaxyLoader = httpLoader(galaxy);

export default (path, options = {}) =>
  galaxyLoader.load(toKey(path, options));
