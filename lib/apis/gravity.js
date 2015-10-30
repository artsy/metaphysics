import qs from 'qs';
import request from 'request';
import { ARTSY_XAPP_TOKEN } from '../../config';
const { ARTSY_API_BASE } = process.env;

export default function(path) {
  let url = `${ARTSY_API_BASE}/${path}`;

  return new Promise((resolve, reject) => {
    request(url, {
      headers: { 'X-XAPP-TOKEN': ARTSY_XAPP_TOKEN },
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
