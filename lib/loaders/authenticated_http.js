import timer from '../timer';
import { verbose, error } from '../loggers';
import { pick } from 'lodash';

export default (api, headers, loaderOptions) => {
  return path => {
    const clock = timer(path);
    clock.start();
    return new Promise((resolve, reject) => {
      verbose(`Requested: ${path}`);
      api(path, headers)
        .then((response) => {
          if (loaderOptions.headers) {
            resolve(pick(response, ['body', 'headers']));
          } else {
            resolve(response.body);
          }
          clock.end();
        })
        .catch((err) => {
          error(path, err);
          reject(err);
        });
    });
  };
};
