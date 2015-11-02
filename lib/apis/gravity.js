import qs from 'qs';
import request from 'request';
import { GRAVITY_XAPP_TOKEN } from '../../config';
const { GRAVITY_API_BASE } = process.env;

export default function(path) {
  let url = `${GRAVITY_API_BASE}/${path}`;

  return new Promise((resolve, reject) => {
    request(url, {
      headers: { 'X-XAPP-TOKEN': GRAVITY_XAPP_TOKEN },
      method: 'GET'
    }, (err, response) => {
      if (err) return reject(err);

      try {
        let parsed = typeof response.body === 'string' ? JSON.parse(response.body) : response.body;
        resolve(parsed);
      } catch(err) {
        reject(err);
      }
    });
  });
};
