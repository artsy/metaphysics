import qs from 'qs';
import gravity from '../apis/gravity';
import httpLoader from './http';

export const gravityLoader = httpLoader(gravity);

export default (path, options = {}) => {
  const queryString = qs.stringify(options, { arrayFormat: 'brackets' });
  return gravityLoader.load(`${path}?${queryString}`);
};
