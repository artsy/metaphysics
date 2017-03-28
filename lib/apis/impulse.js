import { assign } from 'lodash';
import fetch from './fetch';
import config from '../../config';

const { IMPULSE_API_BASE } = process.env;

export default (path, accessToken) => {
  const headers = {};
  if (accessToken) assign(headers, { 'Authorization': `Bearer ${accessToken}` });
  return fetch(`${IMPULSE_API_BASE}/${path}`, { headers });
};
