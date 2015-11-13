import _ from 'lodash';
import debug from 'debug';
import DataLoader from 'dataloader';
import cache from '../cache';
import timer from './timer';
import { throttled } from './throttle';

let log = debug('info');

export default (api) => {
  return new DataLoader(paths => Promise.all(paths.map(path => {
    let start = timer.start(path);

    return new Promise((resolve, reject) => {
      cache
        .get(path)
        .then((data) => {
          log(`Cached: ${path}`);
          timer.end(start);

          resolve(data);

          throttled(path, () => {
            api(path)
              .then(data => {
                log(`Refreshing: ${path}`);
                cache.set(path, data);
              });
          });
        }, () => {
          api(path)
            .then(data => {
              log(`Requested: ${path}`);
              timer.end(start);
              cache.set(path, data);
              resolve(data);
            })
            .catch(reject);
        });
    });

  })), {
    batch: false,
    cache: true
  });
};
