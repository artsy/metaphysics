import config from '../config';

export const requesting = {};

export const throttled = (key, fn) => {
  if (requesting[key]) return;
  fn();
  requesting[key] = true;
  setTimeout(() => {
    delete requesting[key];
  }, config.REQUEST_THROTTLE_MS);
};
