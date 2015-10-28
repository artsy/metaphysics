import DataLoader from 'dataloader';
import qs from 'querystring';
import artsy from './artsy';
import { client } from './cache';

export let artsyLoader = new DataLoader(paths => Promise.all(paths.map(path => {
  return new Promise((resolve, reject) => {
    client.get(path, (err, data) => {
      if (err) return reject(err);
      if (data) {
        console.log('Cached:', path);
        resolve(JSON.parse(data));
      } else {
        artsy(path)
          .then(data => {
            resolve(data);
            client.set(path, JSON.stringify(data));
          });
      };
    });
  });
})));

export default (path, options = {}) => {
  return artsyLoader.load(`${path}?${qs.stringify(options)}`);
};
