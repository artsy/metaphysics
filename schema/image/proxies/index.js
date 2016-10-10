import gemini from './gemini';
import embedly from './embedly';

const { RESIZING_SERVICE } = process.env;

/* eslint-disable prefer-spread */
/* eslint-disable prefer-rest-params */
module.exports = function resizeWith() {
  if (RESIZING_SERVICE === 'embedly') return embedly.apply(null, arguments);
  return gemini.apply(null, arguments);
};
