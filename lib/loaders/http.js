import DataLoader from 'dataloader';
import cache from '../cache';
import timer from '../timer';
import { throttled } from '../throttle';
import { error, verbose } from '../loggers';

export default api => {
  return new DataLoader(paths => Promise.all(paths.map(path => {
    const clock = timer(path);

    clock.start();

    return new Promise((resolve, reject) => {
      cache
        .get(path)
        .then((data) => {
          resolve(data);

          verbose(`Cached: ${path}`);
          clock.end();
          throttled(path, () => {
            api(path)
              .then(response => {
                verbose(`Refreshing: ${path}`);
                cache.set(path, response);
              });
          });
        }, () => {
          api(path)
            .then(response => {
              resolve(response);

              verbose(`Requested (Uncached): ${path}`);
              clock.end();
              cache.set(path, response);
            })
            .catch(err => {
              reject(err);
              error(path, err);
            });
        });
    });
  })), {
    batch: false,
    cache: true,
  });
};
