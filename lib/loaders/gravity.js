import { toKey } from '../helpers';
import { defaults } from 'lodash';
import gravity from '../apis/gravity';
import httpLoader from './http';
import authenticatedHttpLoader from './authenticated_http';
import all from '../all';

export const gravityLoader = httpLoader(gravity);

const load = (path, options = {}) => {
  const key = toKey(path, options);
  return gravityLoader.load(key);
};

load.with = (accessToken, loaderOptions = {}) => {
  const authenticatedGravityLoader = authenticatedHttpLoader(gravity, accessToken, loaderOptions);
  return (path, options = {}) => {
    const key = toKey(path, options);
    if (accessToken) {
      return authenticatedGravityLoader(key, accessToken);
    }
    return gravityLoader.load(key);
  };
};

load.authenticatedPost = (accessToken, loaderOptions = {}) => {
  const opts = defaults(loaderOptions, {
    method: 'POST',
  });
  const authenticatedGravityLoader = authenticatedHttpLoader(gravity, accessToken, opts);
  return (path, options = {}) => {
    const key = toKey(path, options);
    return authenticatedGravityLoader(key, accessToken);
  };
}

load.all = all;

export default load;
