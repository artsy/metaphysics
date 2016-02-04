import qs from 'qs';
import gravity from '../apis/gravity';
import httpLoader from './http';
import authenticatedHttpLoader from './authenticated_http';

export const gravityLoader = httpLoader(gravity);

const keyify = (path, options = {}) => {
  const queryString = qs.stringify(options, { arrayFormat: 'brackets' });
  return `${path}?${queryString}`;
};

const load = (path, options = {}) => {
  const key = keyify(path, options);
  return gravityLoader.load(key);
};

load.with = (accessToken) => {
  const authenticatedGravityLoader = authenticatedHttpLoader(gravity, accessToken);
  return (path, options = {}) => {
    const key = keyify(path, options);
    return authenticatedGravityLoader(key, accessToken);
  };
};

export default load;
