import timer from '../timer';
import { verbose, error } from '../loggers';

export default (api, headers) => {
  return path => {
    const clock = timer(path);
    clock.start();
    return new Promise((resolve, reject) => {
      verbose(`Requested: ${path} with ${JSON.stringify(headers)}`);
      api(path, headers)
        .then(response => {
          resolve(response);
          clock.end();
        })
        .catch((err) => {
          error(path, err);
          reject(err);
        });
    });
  };
};
