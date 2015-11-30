import fetch from './fetch';
import config from '../../config';
const { GRAVITY_API_BASE } = process.env;

export default (path) => {
  return fetch(`${GRAVITY_API_BASE}/${path}`, {
    headers: {'X-XAPP-TOKEN': config.GRAVITY_XAPP_TOKEN }
  });
};
