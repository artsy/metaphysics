import _ from 'lodash';
import request from 'request';

export default (url, options = {}) => {
  return new Promise((resolve, reject) => {
    request(url, _.defaults(options, { method: 'GET' }), (err, response) => {
      if (err || response.statusCode !== 200) return reject(err);

      try {
        let parsed = typeof response.body === 'string' ? JSON.parse(response.body) : response.body;
        resolve(parsed);
      } catch(err) {
        reject(err);
      }
    });
  });
};
