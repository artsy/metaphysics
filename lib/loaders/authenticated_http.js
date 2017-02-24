import timer from '../timer';
import { verbose, error } from '../loggers';

export default (api, headers, loaderOptions) => {
  return path => {
    const clock = timer(path);
    clock.start();
    return new Promise((resolve, reject) => {
      verbose(`Requested: ${path}`);
      api(path, headers)
        .then(({ body, headers }) => {
          if(loaderOptions.headers) {
            resolve({ body, headers});
          } else {
            resolve(body);
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
