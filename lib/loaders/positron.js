import qs from 'qs';
import positron from '../apis/positron';
import httpLoader from './http';

export let positronLoader = httpLoader(positron);

export default (path, options = {}) => {
  let queryString = qs.stringify(options, { arrayFormat: 'brackets' });
  return positronLoader.load(`${path}?${queryString}`);
};
