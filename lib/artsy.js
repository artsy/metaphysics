import request from 'request';
import qs from 'querystring';
import { ARTSY_XAPP_TOKEN } from '../config';
let { API_ENDPOINT } = process.env;

export default function(path, data) {
  return new Promise((resolve, reject) => {
    let url = `${API_ENDPOINT}/${path}`;

    console.log('Requesting:', `${url}?${qs.stringify(data)}`);

    request(url, {
      headers: { 'X-XAPP-TOKEN': ARTSY_XAPP_TOKEN },
      method: 'GET',
      qs: data,
    }, (err, response) => {
      if (err) return reject(err);
      let parsed = typeof response.body === 'string' ? JSON.parse(response.body) : response.body;
      resolve(parsed);
    });
  });
};
