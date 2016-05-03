import { assign } from 'lodash';
import { toKey } from '../helpers';
import gravity from '../apis/gravity';
import httpLoader from './http';

export const total = ({ path, options }) => {
  const key = toKey(path, assign({}, options, {
    size: 1,
    total_count: 1,
  }));

  return gravity(key)
    .then(({ headers }) => ({
      body: {
        total: parseInt(headers['x-total-count'] || 0, 10),
      },
    }));
};

export const totalLoader = httpLoader(total);

const load = (path, options = {}) =>
  totalLoader.load({ path, options })
    .then(response => response.total);

export default load;
