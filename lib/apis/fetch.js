import { get, defaults, compact } from 'lodash';
import request from 'request';
import config from '../../config';

export default (url, options = {}) => {
  return new Promise((resolve, reject) => {
    const opts = defaults(options, {
      method: 'GET',
      timeout: config.REQUEST_TIMEOUT_MS,
    });

    request(url, opts, (err, response) => {
      if (!!err || response.statusCode !== 200) {
        if (err) return reject(err);

        const message = compact([
          get(response, 'request.uri.href'),
          response.body,
        ]).join(' - ');
        const error = new Error(message);
        error.statusCode = response.statusCode;
        return reject(error);
      }

      try {
        const shouldParse = typeof response.body === 'string';
        const parsed = shouldParse ? JSON.parse(response.body) : response.body;

        resolve({
          body: parsed,
          headers: response.headers,
        });
      } catch (error) {
        reject(error);
      }
    });
  });
};
