import request from './request';
import { GRAVITY_XAPP_TOKEN } from '../../config';
const { GRAVITY_API_BASE } = process.env;

export default (path) => {
  return request(`${GRAVITY_API_BASE}/${path}`, {
    headers: {'X-XAPP-TOKEN': GRAVITY_XAPP_TOKEN }
  });
};
