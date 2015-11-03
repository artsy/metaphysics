import qs from 'qs';
import gravity from '../apis/gravity';
import httpLoader from './http';

export let gravityLoader = httpLoader(gravity);

export default (path, options = {}) => {
  let queryString = qs.stringify(options, { arrayFormat: 'brackets' });
  return gravityLoader.load(`${path}?${queryString}`);
};
