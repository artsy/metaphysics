import qs from 'qs';
import url from 'url';
import { assign, omit } from 'lodash';

import { toKey } from '../helpers';
import gravity from '../apis/gravity';
import httpLoader from './http';

export const totalFunction = (path, accessToken, options = {}) => {
  const urlObject = url.parse(path, true);
  const existingOptions = qs.parse(urlObject.query);
  const parsedKey = toKey(urlObject.pathname, assign({}, existingOptions, options, {
    size: 0,
    total_count: 1,
  }));

  return gravity(parsedKey, accessToken)
    .then(({ headers }) => ({
      body: {
        total: parseInt(headers['x-total-count'] || 0, 10),
      },
    }));
};

export const totalLoader = httpLoader(totalFunction);

const load = (path, options = {}) => {
  const key = toKey(path, assign({}, omit(options, 'page', 'size')));

  return totalLoader.load(key)
    .then(response => response.total);
};

export default load;
