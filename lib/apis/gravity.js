import { assign } from 'lodash';
import fetch from './fetch';
import config from '../../config';

const { GRAVITY_API_BASE } = process.env;

export default (path, accessToken) => {
  const headers = { 'X-XAPP-TOKEN': config.GRAVITY_XAPP_TOKEN };
  if (accessToken) assign(headers, { 'X-ACCESS-TOKEN': accessToken });
  return fetch(`${GRAVITY_API_BASE}/${path}`, { headers });
};
