import _ from 'lodash';
import redis from 'redis';
import debug from 'debug';
const { NODE_ENV, REDIS_URL } = process.env;

export let client = redis.createClient(REDIS_URL);

client.on('error', debug('error'));

export default {
  get: (key) => {
    return new Promise((resolve, reject) => {
      client.get(key, (err, data) => {
        if (err) return reject(err);
        if (data) return resolve(JSON.parse(data));
        reject();
      });
    });
  },

  set: (key, data) => {
    let timestamp = new Date().getTime();
    _.isArray(data) ? data.map(datum => datum.cached = timestamp) : data.cached = timestamp;
    return client.set(key, JSON.stringify(data));
  }
};
