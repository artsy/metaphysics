import debug from 'debug';
import DataLoader from 'dataloader';
import cache from '../cache';
import timer from './timer';
import { throttled } from './throttle';

const log = debug('info');

export default (api) => {
  return new DataLoader(paths => Promise.all(paths.map(path => {
    const start = timer.start(path);

    return new Promise((resolve, reject) => {
      cache
        .get(path)
        .then((data) => {
          log(`Cached: ${path}`);
          timer.end(start);

          resolve(data);

          throttled(path, () => {
            api(path)
              .then(response => {
                log(`Refreshing: ${path}`);
                cache.set(path, response);
              });
          });
        }, () => {
          api(path)
            .then(response => {
              log(`Requested: ${path}`);
              timer.end(start);
              cache.set(path, response);
              resolve(response);
            })
            .catch((err) => {
              debug('error')(path, err);
              reject(err);
            });
        });
    });
  })), {
    batch: false,
    cache: true,
  });
};
