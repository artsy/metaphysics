import { REQUEST_THROTTLE_MS } from '../../config';

export let requesting = {};

export let throttled = (key, fn) => {
  if (requesting[key]) return;
  fn();
  requesting[key] = true;
  setTimeout((() => delete requesting[key]), REQUEST_THROTTLE_MS);
};
