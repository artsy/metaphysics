import { toKey } from '../helpers';
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

load.all = all;

export default load;
