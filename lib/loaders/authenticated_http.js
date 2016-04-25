import timer from '../timer';
import { verbose, error } from '../loggers';

export default (api, headers) => {
  return path => {
    const clock = timer(path);
    clock.start();
    return new Promise((resolve, reject) => {
      verbose(`Requested: ${path}`);
      api(path, headers)
        .then(({ body }) => {
          resolve(body);
          clock.end();
        })
        .catch((err) => {
          error(path, err);
          reject(err);
        });
    });
  };
};
