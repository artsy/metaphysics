import _ from 'lodash';
import request from 'request';
import qs from 'querystring';
import { ARTSY_XAPP_TOKEN } from '../config';
const { ARTSY_API_BASE } = process.env;

export default function(path, options = {}) {
  return new Promise((resolve, reject) => {
    let url = `${ARTSY_API_BASE}/${path}`;

    if (options.count) {
      options = _.extend(_.omit(options, 'count'), { total_count: 1 });
    }

    console.log('Requesting:', `${url}?${qs.stringify(options)}`);

    request(url, {
      headers: { 'X-XAPP-TOKEN': ARTSY_XAPP_TOKEN },
      method: 'GET',
      qs: options,
    }, (err, response) => {
      if (err) return reject(err);

      let parsed = typeof response.body === 'string' ? JSON.parse(response.body) : response.body;

      if (response.headers['x-total-count'] && _.isPlainObject(parsed)) {
        _.defaults(parsed, { total: parseInt(response.headers['x-total-count'] || 0) });
      };

      resolve(parsed);
    });
  });
};
