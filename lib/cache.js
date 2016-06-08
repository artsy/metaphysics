import {
  isNull,
  isArray,
} from 'lodash';
import { Client } from 'memjs';
import config from '../config';
import { error } from './loggers';

const { NODE_ENV } = process.env;
const { CACHE_LIFETIME_IN_SECONDS } = config;

const createClient = () => {
  if (NODE_ENV === 'test') {
    const store = {};
    return {
      store,
      get: (key, cb) => cb(null, store[key]),
      set: (key, data) => store[key] = data,
    };
  }

  return Client.create(null, {
    expires: CACHE_LIFETIME_IN_SECONDS,
  });
};

export const client = createClient();

export default {
  get: (key) => {
    return new Promise((resolve, reject) => {
      if (isNull(client)) return reject(new Error('Cache client is `null`'));

      client.get(key, (err, data) => {
        if (err) return reject(err);
        if (data) return resolve(JSON.parse(data));
        reject(new Error('cache#get did not return `data`'));
      });
    });
  },

  set: (key, data) => {
    if (isNull(client)) return false;

    const timestamp = new Date().getTime();
    if (isArray(data)) {
      data.map(datum => datum.cached = timestamp); // eslint-disable-line no-param-reassign
    } else {
      data.cached = timestamp; // eslint-disable-line no-param-reassign
    }

    return client.set(key, JSON.stringify(data), err => {
      if (err) error(err);
    });
  },

  delete: (key) =>
    new Promise((resolve, reject) =>
      client.delete(key, (err, response) => {
        if (err) return reject(err);
        resolve(response);
      })
    ),
};
