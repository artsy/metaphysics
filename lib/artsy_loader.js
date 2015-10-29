import DataLoader from 'dataloader';
import qs from 'querystring';
import artsy from './artsy';
import { client } from './cache';

export let artsyLoader = new DataLoader(paths => Promise.all(paths.map(path => {
  let start = process.hrtime();
  console.info(`Loading: ${path}`);

  return new Promise((resolve, reject) => {
    client.get(path, (err, data) => {
      if (data) {
        console.info(`Cached: ${path}`);
        let end = process.hrtime(start);
        console.info(`Elapsed: ${end[1] / 1000000}ms`);
        return resolve(JSON.parse(data));
      } else {
        artsy(path).then((data) => {
          console.info(`Requested: ${path}`);
          let end = process.hrtime(start);
          console.info(`Elapsed: ${end[1] / 1000000}ms`);
          client.set(path, JSON.stringify(data));
          resolve(data);
        });
      }
    });
  });

})), { batch: false, cache: true });

export default (path, options = {}) => {
  return artsyLoader.load(`${path}?${qs.stringify(options)}`);
};
