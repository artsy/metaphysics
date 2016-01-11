import _ from 'lodash';
import request from 'request';
import config from '../../config';

export default (url, options = {}) => {
  return new Promise((resolve, reject) => {
    const opts = _.defaults(options, { method: 'GET', timeout: config.REQUEST_TIMEOUT_MS });
    request(url, opts, (err, response) => {
      if (!!err || response.statusCode !== 200) return reject(err || new Error(response.body));

      try {
        const shouldParse = typeof response.body === 'string';
        const parsed = shouldParse ? JSON.parse(response.body) : response.body;
        resolve(parsed);
      } catch (error) {
        reject(error);
      }
    });
  });
};
