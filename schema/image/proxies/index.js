const { RESIZING_SERVICE } = process.env;
import gemini from './gemini';
import embedly from './embedly';

module.exports = function resizeWith() {
  if (RESIZING_SERVICE === 'embedly') return embedly.apply(null, arguments);
  return gemini.apply(null, arguments);
};
