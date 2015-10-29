import qs from 'qs';
import request from 'request';
import { ARTSY_XAPP_TOKEN } from '../../config';
const { ARTSY_API_BASE } = process.env;

export default function(path) {
  return new Promise((resolve, reject) => {
    let url = `${ARTSY_API_BASE}/${path}`;
    request(url, {
      headers: { 'X-XAPP-TOKEN': ARTSY_XAPP_TOKEN },
      method: 'GET'
    }, (err, response) => {
      if (err) return reject(err);
      let parsed = typeof response.body === 'string' ? JSON.parse(response.body) : response.body;
      resolve(parsed);
    });
  });
};
