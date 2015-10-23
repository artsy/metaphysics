import request from 'request';
import { ARTSY_XAPP_TOKEN } from '../config';

export default function(path, data) {
  if (typeof path !== 'string') {
    path = path.join('/');
  };

  return new Promise((resolve, reject) => {
    let url = process.env.API_ENDPOINT + '/' + path;

    console.log('Requesting:', url);

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
