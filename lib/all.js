import {
  assign,
  times,
  flatten,
} from 'lodash';

import allLoaders from './loaders/total';
import gravity from './loaders/gravity';

export const loaded = (path, options = {}) => {
  return allLoaders(path, options)
    .then(n => {
      const pages = Math.ceil(n / (options.size || 25));
      return Promise.all(times(pages, i =>
        gravity(path, assign({}, options, { page: i + 1 }))
      ));
    })
    .then(flatten);
};

export default loaded;
