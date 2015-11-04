import { THROTTLE_TIME } from '../../config';

export let requesting = {};

export let throttled = (key, fn) => {
  if (requesting[key]) return;
  fn();
  requesting[key] = true;
  setTimeout((() => delete requesting[key]), THROTTLE_TIME);
};
