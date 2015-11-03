import qs from 'qs';
import request from 'request';
const { POSITRON_API_BASE } = process.env;

export default function(path) {
  let url = `${POSITRON_API_BASE}/${path}`;

  return new Promise((resolve, reject) => {
    request(url, {
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
