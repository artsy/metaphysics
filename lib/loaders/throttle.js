import config from '../../config';

export let requesting = {};

export let throttled = (key, fn) => {
  if (requesting[key]) return;
  fn();
  requesting[key] = true;
  setTimeout((() => delete requesting[key]), config.REQUEST_THROTTLE_MS);
};
