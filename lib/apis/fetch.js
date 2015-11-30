import _ from 'lodash';
import request from 'request';
import config from '../../config';

export default (url, options = {}) => {
  return new Promise((resolve, reject) => {
    request(url, _.defaults(options, { method: 'GET', timeout: config.REQUEST_TIMEOUT_MS }), (err, response) => {
      if (!!err || response.statusCode !== 200) return reject(err || new Error(response.body));

      try {
        let parsed = typeof response.body === 'string' ? JSON.parse(response.body) : response.body;
        resolve(parsed);
      } catch(err) {
        reject(err);
      }
    });
  });
};
