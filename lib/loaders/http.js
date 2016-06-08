import DataLoader from 'dataloader';
import cache from '../cache';
import timer from '../timer';
import { throttled } from '../throttle';
import { error, verbose } from '../loggers';

export default api => {
  return new DataLoader(keys => Promise.all(keys.map(key => {
    const clock = timer(key);

    clock.start();

    return new Promise((resolve, reject) => {
      cache
        .get(key)
        .then(data => {
          resolve(data);

          verbose(`Cached: ${key}`);
          clock.end();
          throttled(key, () => {
            api(key)
              .then(({ body }) => {
                verbose(`Refreshing: ${key}`);
                cache.set(key, body);
              })
              .catch(err => {
                if (err.statusCode === 404) { // Unpublished
                  cache.delete(key);
                }
              });
          });
        }, () => {
          api(key)
            .then(({ body }) => {
              resolve(body);

              verbose(`Requested (Uncached): ${key}`);
              clock.end();
              cache.set(key, body);
            })
            .catch(err => {
              reject(err);
              error(key, err);
            });
        });
    });
  })), {
    batch: false,
    cache: true,
  });
};
