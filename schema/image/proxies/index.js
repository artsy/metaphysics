const { RESIZING_SERVICE } = process.env;
import gemini from './gemini';
import embedly from './embedly';

module.exports = function resizeWith() {
  if (RESIZING_SERVICE === 'gemini') return gemini.apply(null, arguments);
  return embedly.apply(null, arguments);
};
