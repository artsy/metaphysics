import DataLoader from 'dataloader';
import qs from 'qs';
import gravity from '../apis/gravity';
import cache from '../cache';
import timer from './timer';

export let gravityLoader = new DataLoader(paths => Promise.all(paths.map(path => {
  let start = timer.start(path);

  return new Promise((resolve, reject) => {
    cache
      .get(path)
      .then((data) => {
        console.info(`Cached: ${path}`);
        timer.end(start);

        resolve(data);

        gravity(path)
          .then(data => {
            console.log(`Refreshing: ${path}`)
            cache.set(path, data)
          })

      }, () => {
        gravity(path)
          .then((data) => {
            console.info(`Requested: ${path}`);
            timer.end(start);
            cache.set(path, data);
            resolve(data);
          });
      });
  });

})), { batch: false, cache: true });

export default (path, options = {}) => {
  let queryString = qs.stringify(options, { arrayFormat: 'brackets' });
  return gravityLoader.load(`${path}?${queryString}`);
};
