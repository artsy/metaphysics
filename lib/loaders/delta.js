import qs from 'qs';
import delta from '../apis/delta';
import httpLoader from './http';

export const deltaLoader = httpLoader(delta);

export default (path, options = {}) => {
  const queryString = qs.stringify(options, { arrayFormat: 'brackets' });
  console.log('`${path}?${queryString}`', `${path}?${queryString}`)
  return deltaLoader.load(`${path}?${queryString}`);
};
