import _ from 'lodash';
import redis from 'redis';
import fakeredis from 'fakeredis';
import debug from 'debug';
const { NODE_ENV, REDIS_URL } = process.env;

let createClient = () => {
  if (NODE_ENV === 'test') {
    return fakeredis.createClient();
  } else {
    return redis.createClient(REDIS_URL);
  }
};

export let client = createClient();

client.on('error', _.once(err => {
  debug('error')(err);
  client = null;
}));

export default {
  get: (key) => {
    return new Promise((resolve, reject) => {
      if (_.isNull(client)) return reject();
      client.get(key, (err, data) => {
        if (err) return reject(err);
        if (data) return resolve(JSON.parse(data));
        reject();
      });
    });
  },

  set: (key, data) => {
    if (_.isNull(client)) return false;
    let timestamp = new Date().getTime();
    _.isArray(data) ? data.map(datum => datum.cached = timestamp) : data.cached = timestamp;
    return client.set(key, JSON.stringify(data));
  }
};
