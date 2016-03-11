import qs from 'qs';
import delta from '../apis/delta';
import httpLoader from './http';

export const deltaLoader = httpLoader(delta);

export default (path, options = {}) => {
  const queryString = qs.stringify(options, { arrayFormat: 'brackets' });
  return deltaLoader.load(`${path}?${queryString}`);
};
