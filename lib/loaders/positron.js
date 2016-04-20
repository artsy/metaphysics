import { toKey } from '../helpers';
import positron from '../apis/positron';
import httpLoader from './http';

export const positronLoader = httpLoader(positron);

export default (path, options = {}) =>
  positronLoader.load(toKey(path, options));
