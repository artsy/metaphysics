import qs from 'qs';
import positron from '../apis/positron';
import httpLoader from './http';

export const positronLoader = httpLoader(positron);

export default (path, options = {}) => {
  const queryString = qs.stringify(options, { arrayFormat: 'brackets' });
  return positronLoader.load(`${path}?${queryString}`);
};
